package com.hdc.hdc_map_backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "property")
public class Property {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name")
    private String name;

    @Column(name = "address")
    private String address;

    @Column(name = "units")
    private Integer units;

    @Column(name = "bld_size")
    private Integer bldSize;

    @Column(name = "unit_size")
    private Integer unitSize;

    @Column(name = "walk_score")
    private Integer walkScore;

    @Column(name = "bike_score")
    private Integer bikeScore;

    @Column(name = "transit_score")
    private Integer transitScore;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "owner")
    private String owner;

    @Column(name = "url")
    private String url;

    @Column(name = "status")
    private String status;

    // Default constructor
    public Property() {
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Integer getUnits() {
        return units;
    }

    public void setUnits(Integer units) {
        this.units = units;
    }

    public Integer getBldSize() {
        return bldSize;
    }

    public void setBldSize(Integer bldSize) {
        this.bldSize = bldSize;
    }

    public Integer getUnitSize() {
        return unitSize;
    }

    public void setUnitSize(Integer unitSize) {
        this.unitSize = unitSize;
    }

    public Integer getWalkScore() {
        return walkScore;
    }

    public void setWalkScore(Integer walkScore) {
        this.walkScore = walkScore;
    }

    public Integer getBikeScore() {
        return bikeScore;
    }

    public void setBikeScore(Integer bikeScore) {
        this.bikeScore = bikeScore;
    }

    public Integer getTransitScore() {
        return transitScore;
    }

    public void setTransitScore(Integer transitScore) {
        this.transitScore = transitScore;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getOwner() {
        return owner;
    }

    public void setOwner(String owner) {
        this.owner = owner;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}