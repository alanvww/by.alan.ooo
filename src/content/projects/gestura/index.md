---
title: "Gestura"
excerpt: "A wearable gesture instrument that empowers performers with cerebral palsy and limited speech to shape live sound and stage visuals through movement."
date: "2023-12-15"
timeframe: "Fall 2023"
role: "Physical Computing & Wearable Engineer"
collaborators:
  - Hanyong (Kyrie) Yang
  - Kefan Lyu
  - Muqing Wang
projectUrl: "https://www.youtube.com/watch?v=gKcay8ixbps"
githubUrl: "https://github.com/alanvww/Gestura_Arduino"
technologies:
  - Arduino Nano 33 IoT
  - Flex Sensors & Soft Potentiometer
  - IMU (Accelerometer & Gyroscope)
  - TouchDesigner
  - Max/MSP/Jitter
coverImage: "./gestura-1.jpg"
tags:
  - creative-coding
  - accessibility
  - hardware
featured: true
order: 5
status: "completed"
publish: true
---

**Gestura** is a wearable performance instrument designed to empower artists with cerebral palsy and limited speech abilities. By translating subtle finger bends and arm trajectories into real-time audio and visual modulation, Gestura expands stage expression beyond vocal communication.

![Gestura wearable system overview and stage output pipeline](./image.png "Gestura wearable sensor mapping from Arduino Nano 33 IoT over Wi-Fi to TouchDesigner and Max/MSP")

## Concept & Inclusive Design

Each movement acts as a brushstroke on a live stage canvas, seamlessly coupling physical gesture with reactive projection visuals and synthesized soundscapes. Built around customizable calibration profiles and a handmade adjustable leather glove and arm strap, Gestura adapts to each performer's unique range of motion rather than requiring the performer to conform to a rigid interface.

## Hardware & Software Architecture

- **Wearable Sensing**: Handmade leather glove and arm strap housing an **Arduino Nano 33 IoT** powered by a 9V battery, reading finger curvature via **flex sensors**, touch position via a **soft potentiometer**, and 6-axis arm orientation via the onboard **accelerometer and gyroscope**.
- **Wireless Telemetry**: Streams calibrated sensor packets over **Wi-Fi** to the stage workstation in real time.
- **Audio & Visual Synthesis**: Drives reactive stage projection graphics in **TouchDesigner** and real-time spatial audio synthesis in **Max/MSP/Jitter**.

## Team & Contributions

- **Alan Ren** — Physical Computing & Wearable Engineering
- **Hanyong (Kyrie) Yang** — Product Design, Branding & Wearable Engineering
- **Kefan Lyu** — Interactive Sound Output (Max/MSP) & Video Editing
- **Muqing Wang** — Generative Visual Output (TouchDesigner) & Project Outreach
