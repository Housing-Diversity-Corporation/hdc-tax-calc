package com.hdc.hdc_map_backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "comps")
public class Comps {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name")
    private String name;

    @Column(name = "address")
    private String address;

    @Column(name = "units")
    private Integer units;

    @Column(name = "studio_rent")
    private Integer studioRent;

    @Column(name = "studio_sf")
    private Integer studioSf;

    @Column(name = "studio_psf")
    private Float studioPsf;

    @Column(name = "onebr1ba_rent")
    private Integer onebr1baRent;

    @Column(name = "onebr1ba_sf")
    private Integer onebr1baSf;

    @Column(name = "onebr1ba_psf")
    private Float onebr1baPsf;

    @Column(name = "utilities")
    private String utilities;

    @Column(name = "parking")
    private String parking;

    @Column(name = "storage")
    private String storage;

    @Column(name = "year")
    private String year;

    @Column(name = "pets")
    private String pets;

    @Column(name = "fireplace")
    private String fireplace;

    @Column(name = "washer_dryer")
    private String washerDryer;

    @Column(name = "controlled_access")
    private String controlledAccess;

    @Column(name = "concessions")
    private String concessions;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    // Default constructor
    public Comps() {
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

    public Integer getStudioRent() {
        return studioRent;
    }

    public void setStudioRent(Integer studioRent) {
        this.studioRent = studioRent;
    }

    public Integer getStudioSf() {
        return studioSf;
    }

    public void setStudioSf(Integer studioSf) {
        this.studioSf = studioSf;
    }

    public Float getStudioPsf() {
        return studioPsf;
    }

    public void setStudioPsf(Float studioPsf) {
        this.studioPsf = studioPsf;
    }

    public Integer getOnebr1baRent() {
        return onebr1baRent;
    }

    public void setOnebr1baRent(Integer onebr1baRent) {
        this.onebr1baRent = onebr1baRent;
    }

    public Integer getOnebr1baSf() {
        return onebr1baSf;
    }

    public void setOnebr1baSf(Integer onebr1baSf) {
        this.onebr1baSf = onebr1baSf;
    }

    public Float getOnebr1baPsf() {
        return onebr1baPsf;
    }

    public void setOnebr1baPsf(Float onebr1baPsf) {
        this.onebr1baPsf = onebr1baPsf;
    }

    public String getUtilities() {
        return utilities;
    }

    public void setUtilities(String utilities) {
        this.utilities = utilities;
    }

    public String getParking() {
        return parking;
    }

    public void setParking(String parking) {
        this.parking = parking;
    }

    public String getStorage() {
        return storage;
    }

    public void setStorage(String storage) {
        this.storage = storage;
    }

    public String getYear() {
        return year;
    }

    public void setYear(String year) {
        this.year = year;
    }

    public String getPets() {
        return pets;
    }

    public void setPets(String pets) {
        this.pets = pets;
    }

    public String getFireplace() {
        return fireplace;
    }

    public void setFireplace(String fireplace) {
        this.fireplace = fireplace;
    }

    public String getWasherDryer() {
        return washerDryer;
    }

    public void setWasherDryer(String washerDryer) {
        this.washerDryer = washerDryer;
    }

    public String getControlledAccess() {
        return controlledAccess;
    }

    public void setControlledAccess(String controlledAccess) {
        this.controlledAccess = controlledAccess;
    }

    public String getConcessions() {
        return concessions;
    }

    public void setConcessions(String concessions) {
        this.concessions = concessions;
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
}