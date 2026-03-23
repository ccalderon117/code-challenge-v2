import pytest
from datetime import date

from django.urls import reverse
from rest_framework.test import APIClient

from map.models import CommunityArea, RestaurantPermit


@pytest.mark.django_db
def test_map_data_view():
    area1 = CommunityArea.objects.create(name="Beverly", area_id=1)
    area2 = CommunityArea.objects.create(name="Lincoln Park", area_id=2)
    area3 = CommunityArea.objects.create(name="Hyde Park", area_id=3)

    RestaurantPermit.objects.create(
        community_area_id=str(area1.area_id),
        issue_date=date(2021, 1, 15),
    )
    RestaurantPermit.objects.create(
        community_area_id=str(area1.area_id),
        issue_date=date(2021, 2, 20),
    )

    RestaurantPermit.objects.create(
        community_area_id=str(area2.area_id),
        issue_date=date(2021, 3, 10),
    )
    RestaurantPermit.objects.create(
        community_area_id=str(area2.area_id),
        issue_date=date(2021, 2, 14),
    )
    RestaurantPermit.objects.create(
        community_area_id=str(area2.area_id),
        issue_date=date(2021, 6, 22),
    )

    # Different year; should not count
    RestaurantPermit.objects.create(
        community_area_id=str(area1.area_id),
        issue_date=date(2020, 5, 5),
    )

    client = APIClient()
    response = client.get(reverse("map_data"), {"year": 2021})

    assert response.status_code == 200

    data = response.json()
    data_by_name = {row["name"]: row for row in data}

    assert data_by_name["Beverly"]["area_id"] == 1
    assert data_by_name["Beverly"]["num_permits"] == 2

    assert data_by_name["Lincoln Park"]["area_id"] == 2
    assert data_by_name["Lincoln Park"]["num_permits"] == 3

    assert data_by_name["Hyde Park"]["area_id"] == 3
    assert data_by_name["Hyde Park"]["num_permits"] == 0