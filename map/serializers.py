from django.db.models import Count
from rest_framework import serializers

from map.models import CommunityArea, RestaurantPermit


class CommunityAreaSerializer(serializers.ModelSerializer):
    num_permits = serializers.SerializerMethodField()

    class Meta:
        model = CommunityArea
        fields = ["name", "area_id", "num_permits"]

    def _get_counts_by_area(self):
        if hasattr(self, "_counts_by_area"):
            return self._counts_by_area

        year = self.context.get("year")
        permit_qs = RestaurantPermit.objects.all()

        if year:
            permit_qs = permit_qs.filter(issue_date__year=year)

        counts = (
            permit_qs.values("community_area_id")
            .annotate(num_permits=Count("id"))
        )

        self._counts_by_area = {
            str(row["community_area_id"]): row["num_permits"]
            for row in counts
        }
        return self._counts_by_area

    def get_num_permits(self, obj):
        counts_by_area = self._get_counts_by_area()
        return counts_by_area.get(str(obj.area_id), 0)