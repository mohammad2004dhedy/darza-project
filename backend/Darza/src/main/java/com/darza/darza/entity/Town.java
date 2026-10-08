package com.darza.darza.entity;

import jakarta.persistence.*;

@Entity
@Table(name="towns")
public class Town {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @JoinColumn(name = "city_id",nullable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    private City city;
    @Column(name = "name",nullable = false)
    private String name;

    public City getCity() {
        return city;
    }

    public Long getId() {
        return id;
    }

    public void setCity(City city) {
        this.city = city;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
