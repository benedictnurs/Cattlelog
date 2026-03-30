from sqlalchemy import (
    Column, Integer, String, Text, Float, ForeignKey, ARRAY, Boolean
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship, declarative_base
from pgvector.sqlalchemy import Vector

#!!! Important This is needed to define the base class for the ORM models
Base = declarative_base()

#########################################
# Professors table
#########################################
class Professors(Base):
    __tablename__ = "professors"

    professor_id = Column(String(50), primary_key=True)
    professor_name = Column(Text, nullable=True)
    profile_url = Column(Text, nullable=True)
    department = Column(Text, nullable=True)
    number_of_ratings = Column(Text, nullable=True)
    overall_rating = Column(Float, nullable=True)
    would_take_again_percentage = Column(String(10), nullable=True)
    level_of_difficulty = Column(Float, nullable=True)
    slug = Column(Text, unique=True, index=True, nullable=False)
    common_tags = Column(ARRAY(Text), nullable=True)
    
    reviews = relationship(
        "Reviews",
        back_populates="professor",
        cascade="all, delete-orphan"
    )
    cattlelog_reviews = relationship(
        "CattlelogReviews",
        back_populates="professor",
        cascade="all, delete-orphan"
    )
    classes = relationship(
        "ClassesProfessors",
        back_populates="professor",
        cascade="all, delete-orphan"
    )

#########################################
# Courses table
#########################################
class Courses(Base):
    __tablename__ = "courses"

    course_id = Column(String(20), primary_key=True)
    course_title = Column(Text, nullable=True)
    units = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    fulfillment_tags = Column(Text, nullable=True)
    prereq = Column(Text, nullable=True)
    offered = Column(Boolean, default=False)
    embedding = Column(Vector(768), nullable=True)
    average_gpa = Column(Float, nullable=True)

    reviews = relationship(
        "Reviews",
        back_populates="course",
        cascade="all, delete-orphan"
    )
    cattlelog_reviews = relationship(
        "CattlelogReviews",
        back_populates="course",
        cascade="all, delete-orphan"
    )
    grades = relationship(
        "Grades",
        back_populates="course",
        cascade="all, delete-orphan"
    )

    classes_professors = relationship(
        "ClassesProfessors",
        back_populates="course",
        lazy="selectin",
        cascade="all, delete-orphan"
    )

#########################################
# Class and professor model
#########################################
class ClassesProfessors(Base):
    __tablename__ = "classes_professors"

    professor_id = Column(
        String(50),
        ForeignKey("professors.professor_id"),
        primary_key=True
    )
    course_id = Column(
        String(20),
        ForeignKey("courses.course_id"),
        primary_key=True
    )
    offered= Column(Boolean, default=False)
    one_review = Column(Text, default=None)

    professor = relationship(
        "Professors",
        back_populates="classes"
    )
    course = relationship(
        "Courses",
        back_populates="classes_professors"
    )

#########################################
# Reviews table
#########################################
class Reviews(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, autoincrement=True)
    professor_id = Column(String(50), ForeignKey("professors.professor_id"))
    course_id = Column(String(20), ForeignKey("courses.course_id"))

    professor_name = Column(Text, nullable=True)
    quality_rating = Column(Float, nullable=True)
    difficulty_rating = Column(Float, nullable=True)
    review = Column(Text, nullable=True)
    tags = Column(ARRAY(Text), nullable=True)
    date = Column(Text, nullable=True)
    grade = Column(Text, nullable=True)

    professor = relationship(
        "Professors",
        back_populates="reviews"
    )
    course = relationship(
        "Courses",
        back_populates="reviews"
    )

#########################################
# Cattlelog unique review table
#########################################
class CattlelogReviews(Base):
    __tablename__ = "cattlelog_reviews"

    id = Column(Integer, primary_key=True, autoincrement=True)
    professor_name = Column(String(50), ForeignKey("professors.professor_name"))
    term = Column(String, nullable=True)
    email = Column(String, nullable=True)
    course_id = Column(String(20), ForeignKey("courses.course_id"))
    quality_rating = Column(Float, nullable=True)
    difficulty_rating = Column(Float, nullable=True)
    review = Column(Text, nullable=True)
    tags = Column(ARRAY(Text), nullable=True)
    date = Column(Text, nullable=True)
    grade = Column(Text, nullable=True)
    unique_review = Column(Boolean, default=True)


    professor = relationship(
        "Professors",
        back_populates="cattlelog_reviews"
    )
    course = relationship(
        "Courses",
        back_populates="cattlelog_reviews"
    )

#########################################
# Grades table
#########################################
class Grades(Base):
    __tablename__ = "grades"

    id = Column(Integer, primary_key=True, autoincrement=True)
    instructor_name = Column(Text, nullable=False)
    course_id = Column(String(20), ForeignKey("courses.course_id"), nullable=False)
    quarter = Column(Text, nullable=False)
    enrolled = Column(Integer, nullable=True)
    grade_distribution = Column(JSONB, nullable=True)
    professor_slug = Column(
        Text,
        ForeignKey("professors.slug", onupdate="CASCADE", ondelete="SET NULL"),
        nullable=False,
        index=True,
    )

    course = relationship("Courses", back_populates="grades")

    professor = relationship(
        "Professors",
        primaryjoin="Grades.professor_slug == Professors.slug",
        viewonly=True,
        uselist=False,
    )