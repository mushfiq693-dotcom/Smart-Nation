from app.db.session import SessionLocal, Base, engine
from app.db.models import Dataset, User


def seed_database():
    """Initializes tables and seeds initial catalogue datasets and RBAC users."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Datasets Catalogue
        initial_datasets = [
            {
                "slug": "hdx-cod-ab-bgd",
                "title": "Bangladesh Subnational Administrative Boundaries (COD-AB v03)",
                "source_org": "UN OCHA / Bangladesh Bureau of Statistics (BBS)",
                "license": "CC BY-IGO",
                "provenance_class": "Official",
                "reporting_period": "2022-2025 (BBS March 2025 Alignment)",
                "spatial_coverage": "National, 8 Divisions, 64 Districts, 507 Upazilas/City Corporations",
                "quality_score": 99.50,
                "missing_pct": 0.00,
                "quality_report": {
                    "topology_errors": 0,
                    "duplicate_pcodes": 0,
                    "crs": "OGC:CRS84",
                    "geometry_type": "MultiPolygon",
                    "validation_status": "PASSED",
                },
            },
            {
                "slug": "copernicus-dem-glo30",
                "title": "Copernicus GLO-30 Digital Elevation Model (30m Resolution)",
                "source_org": "European Space Agency (ESA) / OpenTopography",
                "license": "Free worldwide reproduction and adaptation",
                "provenance_class": "Official",
                "reporting_period": "2020-2024 Reference Baseline",
                "spatial_coverage": "Bangladesh (30m Planar Grid)",
                "quality_score": 98.80,
                "missing_pct": 0.00,
                "quality_report": {
                    "vertical_accuracy_m": 2.0,
                    "coastal_coverage": "100%",
                    "validation_status": "PASSED",
                },
            },
            {
                "slug": "open-meteo-era5",
                "title": "Historical Climate & Heat Reanalysis (ERA5 / ERA5-Land)",
                "source_org": "ECMWF / Open-Meteo",
                "license": "CC BY 4.0 Non-commercial Free Tier",
                "provenance_class": "Reanalysis_Estimate",
                "reporting_period": "1950 - Present (Daily & Hourly)",
                "spatial_coverage": "Bangladesh (0.1 deg ~11km grid)",
                "quality_score": 96.20,
                "missing_pct": 0.50,
                "quality_report": {
                    "variables": ["temperature_2m", "apparent_temperature", "relative_humidity"],
                    "resolution": "0.1 degree",
                    "validation_status": "PASSED",
                },
            },
            {
                "slug": "open-meteo-glofas-v4",
                "title": "Global Flood Awareness System (GloFAS v4 River Discharge)",
                "source_org": "Copernicus EMS / Open-Meteo",
                "license": "CC BY 4.0 Non-commercial Free Tier",
                "provenance_class": "Reanalysis_Estimate",
                "reporting_period": "1984 - Present + 7-Month Forecast",
                "spatial_coverage": "Major River Basins (0.05 deg ~5km grid)",
                "quality_score": 94.50,
                "missing_pct": 1.20,
                "quality_report": {
                    "discharge_variable": "river_discharge_m3_s",
                    "percentile_indicator": "p75_discharge",
                    "validation_status": "PASSED",
                },
            },
            {
                "slug": "openaq-v3-bgd",
                "title": "Ambient Air Quality Ground Station Telemetry (OpenAQ v3)",
                "source_org": "OpenAQ Community / Department of Environment (DoE)",
                "license": "Open Data with Attribution",
                "provenance_class": "Official",
                "reporting_period": "Real-time & Historical Telemetry",
                "spatial_coverage": "Ground Monitoring Stations (Country ID: 128)",
                "quality_score": 88.00,
                "missing_pct": 12.00,
                "quality_report": {
                    "active_stations": 15,
                    "measured_parameters": ["pm25", "pm10", "co", "no2"],
                    "known_gap": "Rural upazilas lack ground monitoring sensors",
                    "validation_status": "FLAGGED_SENSOR_SCARCITY",
                },
            },
            {
                "slug": "worldbank-indicators-v2",
                "title": "World Bank Development & Demographic Indicators (API v2)",
                "source_org": "The World Bank Group",
                "license": "CC BY 4.0",
                "provenance_class": "Official",
                "reporting_period": "2018 - 2024",
                "spatial_coverage": "National & Divisional Downscaling",
                "quality_score": 97.40,
                "missing_pct": 2.10,
                "quality_report": {
                    "primary_indicators": ["SP.POP.TOTL", "EN.POP.DNST", "SI.POV.NAHC"],
                    "validation_status": "PASSED",
                },
            },
        ]

        for d in initial_datasets:
            existing = db.query(Dataset).filter(Dataset.slug == d["slug"]).first()
            if not existing:
                dataset_obj = Dataset(**d)
                db.add(dataset_obj)

        # 2. Seed RBAC Users
        initial_users = [
            {
                "username": "public_guest",
                "email": "public@civicsphere.gov.bd",
                "hashed_password": "pbkdf2:sha256:mock_hash_for_testing",
                "role": "Public_Portal",
                "organization": "Citizen Public Transparency Portal",
            },
            {
                "username": "dhaka_analyst",
                "email": "analyst@dncc.gov.bd",
                "hashed_password": "pbkdf2:sha256:mock_hash_for_testing",
                "role": "Municipal_Analyst",
                "organization": "Dhaka North City Corporation (DNCC)",
            },
            {
                "username": "planning_reviewer",
                "email": "reviewer@plandiv.gov.bd",
                "hashed_password": "pbkdf2:sha256:mock_hash_for_testing",
                "role": "Policy_Reviewer",
                "organization": "Planning Division / LGD Bangladesh",
            },
            {
                "username": "admin_master",
                "email": "admin@civicsphere.gov.bd",
                "hashed_password": "pbkdf2:sha256:mock_hash_for_testing",
                "role": "System_Admin",
                "organization": "National Data Intelligence Center",
            },
        ]

        for u in initial_users:
            existing_user = db.query(User).filter(User.username == u["username"]).first()
            if not existing_user:
                user_obj = User(**u)
                db.add(user_obj)

        db.commit()
        print("Database seed completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
