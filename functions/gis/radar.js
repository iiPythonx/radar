// Copyright (c) 2025 iiPython

export async function onRequestGet(context) {
    return await fetch(
        "https://opengeo.ncep.noaa.gov/geoserver/conus/conus_bref_qcd/ows?" + (new URL(context.request.url)).searchParams.toString(),
        {
            headers: {
                "Referer": "https://radar.weather.gov/",
                "Referrer": "https://radar.weather.gov/"
            }
        }
    );
}
