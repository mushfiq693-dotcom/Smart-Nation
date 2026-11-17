import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Numeric,
    Boolean,
    DateTime,
    Date,
    Integer,
    ForeignKey,
    JSON,
    Text,
)
from sqlalchemy.orm import relationship
from app.db.session import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Dataset(Base):
    """
    Unified Data Catalogue & Quality Gate Registry.
    Tracks provenance, reporting periods, geometry status, and quality scores.
    """
    __tablename__ = "datasets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    source_org = Column(String(255), nullable=False)
    license = Column(String(100), nullable=False)
    provenance_class = Column(String(50), nullable=False)  # 'Official', 'Reanalysis_Estimate', 'Synthetic_Demo'
    reporting_period = Column(String(100), nullable=False)
    spatial_coverage = Column(String(100), default="Bangladesh (ADM1/2/3)")
    quality_score = Column(Numeric(5, 2), nullable=True)  # e.g., 100.00 or 98.50
    missing_pct = Column(Numeric(5, 2), nullable=True)  # e.g., 2.30
    quality_report = Column(JSON, nullable=False, default=dict)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)

    def to_dict(self):
        return {
            "id": self.id,
            "slug": self.slug,
            "title": self.title,
            "source_org": self.source_org,
            "license": self.license,
            "provenance_class": self.provenance_class,
            "reporting_period": self.reporting_period,
            "spatial_coverage": self.spatial_coverage,
            "quality_score": float(self.quality_score) if self.quality_score else None,
            "missing_pct": float(self.missing_pct) if self.missing_pct else None,
            "quality_report": self.quality_report,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class PolicyScenario(Base):
    """
    ClimAct Twin Policy Simulation Scenarios.
    Stores What-If slider parameters, alpha_equity, and allocations.
    """
    __tablename__ = "policy_scenarios"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    created_by = Column(String(100), nullable=False)
    admin_level = Column(String(20), nullable=False, default="adm2")  # 'adm2', 'adm3', 'h3'
    budget_usd = Column(Numeric(14, 2), nullable=False)
    alpha_equity = Column(Numeric(4, 2), nullable=False)  # e.g. 0.00 to 1.00
    sector_weights = Column(JSON, nullable=False, default=dict)  # e.g. {"heat": 0.4, "flood": 0.4, "air": 0.2}
    allocations = Column(JSON, nullable=False, default=list)  # Top ranked allocations per pcode
    is_exploratory = Column(Boolean, default=True)
    approved_by_human = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    outcomes = relationship("PolicyOutcome", back_populates="scenario", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "created_by": self.created_by,
            "admin_level": self.admin_level,
            "budget_usd": float(self.budget_usd),
            "alpha_equity": float(self.alpha_equity),
            "sector_weights": self.sector_weights,
            "allocations": self.allocations,
            "is_exploratory": self.is_exploratory,
            "approved_by_human": self.approved_by_human,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class PolicyOutcome(Base):
    """
    Closed-Loop Policy Outcomes Tracker.
    Connects simulated target interventions to baselines, measurable KPIs, and agency review dates.
    """
    __tablename__ = "policy_outcomes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    scenario_id = Column(String(36), ForeignKey("policy_scenarios.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    target_pcode = Column(String(50), nullable=False, index=True)
    responsible_agency = Column(String(100), nullable=False)
    indicator_code = Column(String(50), nullable=False)
    baseline_value = Column(Numeric(12, 4), nullable=False)
    target_value = Column(Numeric(12, 4), nullable=False)
    observed_value = Column(Numeric(12, 4), nullable=True)
    status = Column(String(30), default="Planned")  # 'Planned', 'Active', 'Under_Review', 'Completed'
    review_date = Column(Date, nullable=False)
    evidence_url = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    scenario = relationship("PolicyScenario", back_populates="outcomes")

    def to_dict(self):
        return {
            "id": self.id,
            "scenario_id": self.scenario_id,
            "title": self.title,
            "target_pcode": self.target_pcode,
            "responsible_agency": self.responsible_agency,
            "indicator_code": self.indicator_code,
            "baseline_value": float(self.baseline_value),
            "target_value": float(self.target_value),
            "observed_value": float(self.observed_value) if self.observed_value is not None else None,
            "status": self.status,
            "review_date": self.review_date.isoformat() if self.review_date else None,
            "evidence_url": self.evidence_url,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class AuditLog(Base):
    """
    Immutable Governance & AI Audit Trail.
    Logs every query, simulation, data sync, and brief generation.
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    actor_role = Column(String(50), nullable=False)  # 'Public_Portal', 'Municipal_Analyst', 'Policy_Reviewer', 'System_Admin'
    action_type = Column(String(100), nullable=False)  # 'COPILOT_QUERY', 'SIMULATION_RUN', 'DATA_INGEST', 'BRIEF_EXPORT'
    endpoint = Column(String(255), nullable=False)
    payload_summary = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    def to_dict(self):
        return {
            "id": self.id,
            "actor_role": self.actor_role,
            "action_type": self.action_type,
            "endpoint": self.endpoint,
            "payload_summary": self.payload_summary,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class User(Base):
    """
    Role-Based Access Control (RBAC) User Entity.
    """
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # 'Public_Portal', 'Municipal_Analyst', 'Policy_Reviewer', 'System_Admin'
    organization = Column(String(150), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "role": self.role,
            "organization": self.organization,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
