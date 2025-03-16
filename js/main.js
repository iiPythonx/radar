// Copyright (c) 2025 iiPython

// Handle updating time
setInterval(() => {
    document.getElementById("time").innerText = (new Date()).toUTCString();
}, 100);

// Handle map
const map = L.map("map", { attributionControl: false, fadeAnimation: false, zoomControl: false }).setView([37.8, -96], 4);
L.control.attribution({ prefix: false }).addTo(map)

// Setup stadia base map
L.tileLayer(
    // "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.{ext}",
    "http://localhost:8001/tiles/{z}/{x}/{y}{r}.{ext}",
    {
        minZoom: 0,
        maxZoom: 10,
        attribution: `&copy; <a href = "https://www.stadiamaps.com/" target = "_blank">Stadia Maps</a>, <a href = "https://openmaptiles.org/" target = "_blank">OpenMapTiles</a>, <a href = "https://www.openstreetmap.org/copyright" target = "_blank">OSM</a>`,
        ext: "png"
    }
).addTo(map);

// Setup NOAA radar
const noaa = L.tileLayer.wms(
    "https://opengeo.ncep.noaa.gov/geoserver/conus/conus_bref_qcd/ows?",
    {
        maxZoom: 10,
        opacity: 0.5,
        layers: "conus_bref_qcd",
        format: "image/png",
        transparent: true,
        version: "1.1.1",
        crs: L.CRS.EPSG3857,
        attribution: `&copy; <a href = "https://www.noaa.gov/" target = "_blank">NOAA</a>, <a href = "https://www.weather.gov/" target = "_blank">NWS</a>`
    }
).addTo(map);

// Make request for capabilities
class Stepper {
    constructor() {
        this.fetch();
        this.index = 19;

        this.tzformat = new Intl.DateTimeFormat("en-US", {
            timeZoneName: "short",
            year: "2-digit", month: "2-digit", day: "2-digit"
        });

        this.time = document.querySelector(".step-time span:first-child");
        this.date = document.querySelector(".step-time span:last-child");

        document.getElementById("back").addEventListener("click", () => { if (this.index) this.index--; this.update(); });
        document.getElementById("next").addEventListener("click", () => { if (this.index < 19) this.index++; this.update(); });
    }
    
    update() {
        const obj = new Date(this.times[this.index]);
        this.time.innerText = obj.toLocaleTimeString([], { hour12: false })
        this.date.innerText = `${this.tzformat.format(obj)}`;
        document.querySelector("progress").value = this.index + 1;
        noaa.setParams({ time: this.times[this.index] });
    }

    async fetch() {
        const response = await fetch("https://opengeo.ncep.noaa.gov/geoserver/conus/conus_bref_qcd/ows?service=wms&version=1.1.1&request=GetCapabilities");
        const xml = (new DOMParser()).parseFromString(await response.text(), "application/xml");
        this.times = xml.querySelector("Extent").innerHTML.split(",").slice(-20);
        this.update();
    }
}

(new Stepper());
