// Copyright (c) 2025 iiPython

// Handle updating time
setInterval(() => {
    document.getElementById("time").innerText = (new Date()).toUTCString();
}, 100);

// Make request for capabilities
class Radar {
    constructor() {

        // Setup map
        this.map = L.map("map", {
            attributionControl: false,
            fadeAnimation: false, 
            maxBounds: [
                [-90, -180],
                [90, 180]
            ],
            maxBoundsViscosity: 1.0,
            zoomControl: false
        }).setView([37.8, -96], 5);

        L.control.attribution({ prefix: false }).addTo(this.map)
        L.tileLayer(
            "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.{ext}",
            {
                minZoom: 2,
                maxZoom: 10,
                attribution: `&copy; <a href = "https://www.stadiamaps.com/" target = "_blank">Stadia Maps</a>, <a href = "https://openmaptiles.org/" target = "_blank">OpenMapTiles</a>, <a href = "https://www.openstreetmap.org/copyright" target = "_blank">OSM</a>`,
                ext: "jpg"
            }
        ).addTo(this.map);

        // Set initial index, 19 = end (.length = 20) since I'm avoiding .at()
        this.index = 19;
        
        // Setup NOAA map options
        this.noaa_url = "/gis/radar";
        this.noaa_opts = {
            bounds: L.latLngBounds(
                L.latLng(10.0, -170.0),
                L.latLng(83.0, -50.0)
            ),
            tileSize: 512,
            minZoom: 2,
            maxZoom: 10,
            opacity: 0,
            layers: "conus_bref_qcd",
            format: "image/png",
            transparent: true,
            version: "1.1.1",
            crs: L.CRS.EPSG3857,
            attribution: `&copy; <a href = "https://www.noaa.gov/" target = "_blank">NOAA</a>, <a href = "https://www.weather.gov/" target = "_blank">NWS</a>`
        }

       // Make initial radar request
       this.fetch();
       setInterval(() => this.fetch(), 5 * 60 * 1000);  // And autoupdate every 5 minutes

        // Handle time/date controls
        this.tzformat = new Intl.DateTimeFormat("en-US", {
            timeZoneName: "short",
            year: "2-digit", month: "2-digit", day: "2-digit"
        });

        this.time = document.querySelector(".step-time span:first-child");
        this.date = document.querySelector(".step-time span:last-child");

        document.getElementById("back").addEventListener("click", () => {
            if (this.interval) clearInterval(this.interval);
            if (this.index) this.index--;
            this.update();
        });
        document.getElementById("next").addEventListener("click", () => {
            if (this.interval) clearInterval(this.interval);
            if (this.index < 19) this.index++;
            this.update();
        });
        document.getElementById("play").addEventListener("click", () => {
            this.interval = setInterval(() => {
                this.index = this.index === 19 ? 0 : this.index + 1;
                this.update();
            }, 200);
        });
        document.getElementById("pause").addEventListener("click", () => {
            if (this.interval) clearInterval(this.interval);
        });
    }
    
    update() {
        const obj = new Date(this.times[this.index]);
        this.time.innerText = obj.toLocaleTimeString([], { hour12: false })
        this.date.innerText = `${this.tzformat.format(obj)}`;
        document.querySelector("progress").value = this.index + 1;

        // Show current layer
        for (const layer of this.layers) layer.setOpacity(0);
        this.layers[this.index].setOpacity(.5);
        if (!this.map.hasLayer(this.layers[this.index])) this.map.addLayer(this.layers[this.index]);
    }

    async fetch() {
        const response = await fetch("https://opengeo.ncep.noaa.gov/geoserver/conus/conus_bref_qcd/ows?service=wms&version=1.1.1&request=GetCapabilities");
        const xml = (new DOMParser()).parseFromString(await response.text(), "application/xml");
        this.times = xml.querySelector("Extent").innerHTML.split(",").slice(-20);

        // Construct layers
        for (const layer of this.layers ?? []) this.map.removeLayer(layer);

        this.layers = [];
        for (const time of this.times) {
            const layer = L.tileLayer.wms(this.noaa_url, this.noaa_opts);
            layer.setParams({ time });
            this.layers.push(layer);
        }

        this.update();
    }
}

(new Radar());
