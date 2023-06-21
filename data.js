let zoneColors = ["#878D90", "#4E84C5", "#519476", "#EC5919", "#A12217"];

async function getHeadingAndRows(input) {
    let text = await input.files[0].text();
    let lines = text.split("\n");
    let rows = [];
    for (line of lines) {
        if (line != "") {
            rows.push(line.split(","));
        }
    }
    let heading = rows[0];
    for (let i = 0; i < heading.length; i++) {
        heading[i] = heading[i].replaceAll("\r", "");
    }
    rows = rows.slice(1, rows.length);
    for (row of rows) {
        for (let i = 0; i < row.length; i++) {
            row[i] = row[i].replaceAll("\r", "");
        }
    }
    let headingAndRows = [];
    headingAndRows.push(heading);
    headingAndRows.push(rows);
    return headingAndRows;
}

function getZonesAverages(rows) {
    let zonesAverages = [];
    for (let i = 0; i < 5; i++) {
        zonesAverages.push(0);
    }
    for (row of rows) {
        for (let i = 4, j = 0; i < 9; i++, j++) {
            zonesAverages[j] += parseInt(row[i]);
        }
    }
    zonesAverages = zonesAverages.map(x => Math.round(x / rows.length));
    return zonesAverages;
}

function getZonesStdDevs(rows, zonesAverages) {
    let zonesStdDevs = [];
    for (let i = 0; i < 5; i++) {
        zonesStdDevs.push(0);
    }
    for (row of rows) {
        for (let i = 4, j = 0; i < 9; i++, j++) {
            zonesStdDevs[j] += Math.pow(parseInt(row[i]) - zonesAverages[j], 2);
        }
    }
    zonesStdDevs = zonesStdDevs.map(x => Math.round(Math.sqrt(x / rows.length)));
    return zonesStdDevs;
}

function getMean(lst, sum=null) {
    sum = sum ?? lst.reduce(((acc, x) => acc + x), 0);
    let mean = sum / lst.length;
    return mean;
}

function getStdDev(lst, mean=null) {
    mean = mean ?? getMean(lst);
    let stdDev = Math.sqrt(lst.reduce(((acc, x) => acc + Math.pow(x - mean, 2)), 0) / lst.length);
    return stdDev;
}

function showZonesAveragesData(heading=null, rows=null) {
    hideAll();
    document.getElementById("graph_description").innerText = "Mean Minutes Per Zone";
    document.getElementById("graph_container").hidden = false;
    document.getElementById("zones_averages_table").hidden = false;
    if (!heading || !rows) {
        heading = JSON.parse(localStorage["heading"]);
        rows = JSON.parse(localStorage["rows"]);
    }
    if (rows.length > 0) {
        let zonesAverages = getZonesAverages(rows);
        let zonesStdDevs = getZonesStdDevs(rows, zonesAverages);
        drawZonesBarChart(zonesAverages);
        removeAllChildren("zones_averages_table_body");
        addZonesLabelsToTable("zones_averages_table_body");
        addZonesValuesToTable(zonesAverages, "zones_averages_table_body");
        addZonesValuesToTable(zonesStdDevs, "zones_averages_table_body");
    } else {
        document.getElementById("no_data_message_container").hidden = false;
        document.getElementById("graph_container").hidden = true;
    }
}

function drawZonesBarChart(zonesValues) {
    let canvas = document.getElementById("graph");
    Chart.getChart("graph")?.destroy();
    let chart = new Chart(canvas, {
        type: "bar",
        data: {
            labels: ["", "", "", "", ""],
            datasets: [{
                label: "Minutes",
                data: zonesValues,
                backgroundColor: zoneColors,
            }],
        },
        options: {
            plugins: {
                legend: {
                    display: false,
                },
            },
        },
    });
}

function addZonesLabelsToTable(tableBodyID) {
    let tableBody = document.getElementById(tableBodyID);
    let zones = ["grey", "blue", "green", "orange", "red"];
    for (let i = 0; i < zones.length; i++) {
        let row = document.createElement("tr");
        tableBody.appendChild(row);
        let element = document.createElement("td");
        let span = document.createElement("span");
        span.style.color = zoneColors[i];
        span.innerText = capitalize(zones[i]);
        element.appendChild(span);
        row.appendChild(element);
    }
}

function addZonesValuesToTable(zonesValues, tableBodyID) {
    let zones = ["grey", "blue", "green", "orange", "red"];
    let tableBody = document.getElementById(tableBodyID);
    for (let i = 0; i < zones.length; i++) {
        let row = tableBody.children[i];
        let element = document.createElement("td");
        element.innerText = zonesValues[i];
        row.appendChild(element);
    }
}

function formatSeconds(seconds) {
    if (typeof seconds == "string") {
        seconds = parseInt(seconds);
    }
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    let days = Math.floor(hours / 24);
    hours %= 24;
    minutes %= 60;
    seconds %= 60;
    let formatted = hours.toString().padStart(2, "0").concat(":", minutes.toString().padStart(2, "0"), ":", Math.round(seconds).toString().padStart(2, "0"));
    if (days == 1) {
        formatted = days.toString().concat(" day ", formatted);
    } else if (days > 1) {
        formatted = days.toString().concat(" days ", formatted);
    }
    return formatted;
}

function validateHeading(heading) {
    let correctHeading = ["location", "date", "start_time", "coach", "grey_zone", "blue_zone", "green_zone", "orange_zone", "red_zone", "calories", "splat_points", "avg_heart_rate", "max_heart_rate", "treadmill_num_steps", "treadmill_distance", "treadmill_time", "treadmill_avg_velocity", "treadmill_max_velocity", "treadmill_avg_incline", "treadmill_max_incline", "treadmill_avg_pace", "treadmill_max_pace", "treadmill_elevation", "rower_distance", "rower_time", "rower_avg_power", "rower_max_power", "rower_avg_velocity", "rower_max_velocity", "rower_500m_split_avg_pace", "rower_500m_split_max_pace", "rower_avg_stroke_rate"];
    if (heading.length != correctHeading.length) {
        return false;
    }
    for (let i = 0; i < heading.length; i++) {
        if (heading[i] != correctHeading[i]) {
            return false;
        }
    }
    return true;
}

function validateWords(s) {
    if (!s || s.length == 0 || s.match(/\w+/)) {
        return true;
    } else {
        return false;
    }
}

function validateDate(s) {
    if (!s || s.length == 0 || s.match(/\d{1,2}\/\d{1,2}\/\d{4}/)) {
        return true;
    } else {
        return false;
    }
}

function validateTimeOfDay(s) {
    if (!s || s.length == 0 || s.match(/\d{1,2}\:\d{1,2} A|PM/)) {
        return true;
    } else {
        return false;
    }
}

function validateInt(s) {
    if (!s || s.length == 0 || s.match(/\d+/)) {
        return true;
    } else {
        return false;
    }
}

function validateIntOrFloat(s) {
    if (!s || s.length == 0 || s.match(/\d+/) || s.match(/\d+\.\d+/)) {
        return true;
    } else {
        return false;
    }
}

function validateTime(s) {
    if (!s || s.length == 0 || s.match(/\d{1,2}\:\d{2}/)) {
        return true;
    } else {
        return false;
    }
}

function validate(heading, rows) {
    if (!validateHeading(heading)) {
        return false;
    }
    for (let i = 0; i < rows.length; i++) {
        if (rows[i].length < 9) {
            return false;
        }
        for (let j = 0; j < 9; j++) {
            if (rows[i][j].length == 0) {
                return false;
            }
        }
        let wordsIndex = [0, 3];
        for (index of wordsIndex) {
            if (!validateWords(rows[i][index])) {
                return false;
            }
        }
        if (!validateDate(rows[i][1])) {
            return false;
        }
        if (!validateTimeOfDay(rows[i][2])) {
            return false;
        }
        let intsIndex = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 18, 19, 23, 26];
        for (index of intsIndex) {
            if (!validateInt(rows[i][index])) {
                return false;
            }
        }
        let floatsIndex = [14, 16, 17, 22, 25, 27, 31];
        for (index of floatsIndex) {
            if (!validateIntOrFloat(rows[i][index])) {
                return false;
            }
        }
        let timesIndex = [15, 20, 21, 24, 29, 30];
        for (index of timesIndex) {
            if (!validateTime(rows[i][index])) {
                return false;
            }
        }
    }
    return true;
}

function compareDates(date1, date2) {
    if (date1.getFullYear() < date2.getFullYear()) {
        return -1;
    } else if (date1.getFullYear() > date2.getFullYear()) {
        return 1;
    } else {
        if (date1.getMonth() < date2.getMonth()) {
            return -1;
        } else if (date1.getMonth() > date2.getMonth()) {
            return 1;
        } else {
            if (date1.getDate() < date2.getDate()) {
                return -1;
            } else if (date1.getDate() > date2.getDate()) {
                return 1;
            } else {
                return 0;
            }
        }
    }
}

async function getNewData() {
    clearPreviousData(false);
    let headingAndRows = await getHeadingAndRows(this);
    let heading = headingAndRows[0];
    let rows = headingAndRows[1];
    localStorage["updateDate"] = JSON.stringify(new Date());
    if (validate(heading, rows)) {
        let units = getUnits();
        localStorage["heading"] = JSON.stringify(heading);
        localStorage["rows"] = JSON.stringify(rows);
        localStorage["units"] = JSON.stringify(units);
        document.getElementById("error_message_container").hidden = true;
        document.getElementById("analysis_container").hidden = false;
        document.getElementById("zones_averages_selector").checked = true;
        document.getElementById("period_all_time_selector").checked = true;
        document.getElementById("hide_outside_std_devs_selector").checked = false;
        document.getElementById("regression_selector").checked = false;
        showValueByTimeSelectors(heading, rows);
        showZonesAveragesData(heading, rows);
        showAllDataTable(heading, rows);
    } else {
        document.getElementById("analysis_container").hidden = true;
        hideAll();
        document.getElementById("error_message_container").hidden = false;
    }
}

function getUnits() {
    let unitsAndIndices = [[null, [0, 1, 2, 3, 9, 10, 13, 15, 18, 19, 20, 21, 24, 29, 30]], ["min", [4, 5, 6, 7, 8]], ["bpm", [11, 12]], ["mi", [14]], ["m", [23]], ["mph", [16, 17, 27, 28]], ["ft", [22]], ["W", [25, 26]], ["strokes/min", [31]]];
    let units = Array(32);
    for (element of unitsAndIndices) {
        let unit = element[0];
        let indices = element[1];
        for (index of indices) {
            units[index] = unit;
        }
    }
    return units;
}

function getPrettyHeading(heading) {
    prettyHeading = []
    for (element of heading) {
        prettyHeading.push(element.split("_").map(word => capitalize(word)).join(" "));
    }
    return prettyHeading;
}

function capitalize(str) {
    return str[0].toUpperCase().concat(str.slice(1));
}

function showAllDataTable(heading=null, rows=null) {
    document.getElementById("all_data_table_container").hidden = false;
    if (!heading || !rows) {
        heading = JSON.parse(localStorage["heading"]);
        rows = JSON.parse(localStorage["rows"]);
    }
    removeAllChildren("all_data_table_heading");
    removeAllChildren("all_data_table_body");
    let prettyHeading = null;
    if (!localStorage["prettyHeading"]) {
        prettyHeading = getPrettyHeading(heading);
        localStorage["prettyHeading"] = JSON.stringify(prettyHeading);
    } else {
        prettyHeading = JSON.parse(localStorage["prettyHeading"]);
    }
    addAllDataHeadingToTable(prettyHeading);
    addAllDataRowsToTable(rows, heading.length);
}

function removeAllChildren(id) {
    let element = document.getElementById(id);
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

function addAllDataHeadingToTable(heading) {
    let tableHeading = document.getElementById("all_data_table_heading");
    let row = document.createElement("tr");
    for (let i = 0; i < heading.length; i++) {
        let cell = document.createElement("td");
        cell.classList.add("all_data_table_cell");
        let bold = document.createElement("b");
        bold.innerText = heading[i];
        cell.appendChild(bold);
        row.appendChild(cell);
    }
    tableHeading.appendChild(row);
}

function addAllDataRowsToTable(rows, headingLength) {
    let tableBody = document.getElementById("all_data_table_body");
    for (let i = 0; i < rows.length; i++) {
        let tableRow = document.createElement("tr");
        for (let j = 0; j < headingLength; j++) {
            let cell = document.createElement("td");
            cell.classList.add("all_data_table_cell");
            if (j < rows[i].length) {
                let bold = document.createElement("b");
                bold.innerText = rows[i][j];
                cell.appendChild(bold);
            }
            tableRow.appendChild(cell);
        }
        tableBody.appendChild(tableRow);
    }
}

function clearPreviousData(removeFiles=true) {
    if (removeFiles) {
        document.getElementById("file_input").value = "";
    }
    document.getElementById("error_message_container").hidden = true;
    document.getElementById("analysis_container").hidden = true;
    hideAll();
    localStorage.clear();
}

function hideAll() {
    document.getElementById("options_selector_form_container").hidden = true;
    document.getElementById("zones_averages_table").hidden = true;
    document.getElementById("zones_totals_table").hidden = true;
    document.getElementById("coaches_data_container").hidden = true;
    document.getElementById("coaches_table_container").hidden = true;
    document.getElementById("coaches_stats_container").hidden = true;
    document.getElementById("locations_data_container").hidden = true;
    document.getElementById("locations_table_container").hidden = true;
    document.getElementById("locations_stats_container").hidden = true;
    document.getElementById("value_by_time_data_container").hidden = true;
    document.getElementById("value_by_time_table_container").hidden = true;
    document.getElementById("value_by_time_stats_container").hidden = true;
    document.getElementById("no_data_message_container").hidden = true;
}

function getCoachesAndCounts(rows) {
    let coachesLocations = {};
    let nonUniqueCoaches = [];
    for (row of rows) {
        if (coachesLocations.hasOwnProperty(row[3]) && coachesLocations[row[3]] != row[0]) {
            nonUniqueCoaches.push(row[3]);
        } else {
            coachesLocations[row[3]] = row[0];
        }
    }
    let coachesAndCounts = {};
    for (row of rows) {
        let coach = (nonUniqueCoaches.includes(row[3])) ? row[3].concat(" (", row[0], ")") : row[3];
        if (coachesAndCounts.hasOwnProperty(coach)) {
            coachesAndCounts[coach] += 1;
        } else {
            coachesAndCounts[coach] = 1;
        }
    }
    coachesAndCounts = Object.entries(coachesAndCounts)
    .sort((a, b) => {
        let x = a[0];
        let y = b[0];
        if (x < y) {
            return -1;
        } else if (x > y) {
            return 1;
        } else {
            return 0;
        }
    })
    .reverse()
    .sort((a, b) => {
        let x = a[1];
        let y = b[1];
        if (x < y) {
            return -1;
        } else if (x > y) {
            return 1;
        } else {
            return 0;
        }
    })
    .reverse()
    return coachesAndCounts;
}

function showCoachesData(heading=null, rows=null) {
    hideAll();
    document.getElementById("graph_description").innerText = "Classes Per Coach";
    document.getElementById("graph_container").hidden = false;
    document.getElementById("coaches_data_container").hidden = false;
    document.getElementById("coaches_table_container").hidden = false;
    document.getElementById("coaches_stats_container").hidden = false;
    if (!heading || !rows) {
        heading = JSON.parse(localStorage["heading"]);
        rows = JSON.parse(localStorage["rows"]);
    }
    if (rows.length > 0) {
        let coachesAndCounts = getCoachesAndCounts(rows);
        drawCoachesBarChart(coachesAndCounts);
        removeAllChildren("coaches_table_body");
        let coaches = coachesAndCounts.map(x => x[0]);
        let counts = coachesAndCounts.map(x => x[1]);
        addIndependentVarsToTable(coaches.map((x) => {
            let match = x.match(/(.*)? (\(.*?\))/);
            if (match) {
                return match[1].concat("\n", match[2]);
            } else {
                return x;
            }
        }), "coaches_table_body");
        addDependentVarsToTable(counts, "coaches_table_body");
        document.getElementById("coaches_total").innerText = rows.length;
    } else {
        document.getElementById("no_data_message_container").hidden = false;
        document.getElementById("graph_container").hidden = true;
    }
}

function drawCoachesBarChart(coachesAndCounts) {
    let canvas = document.getElementById("graph");
    Chart.getChart("graph")?.destroy();
    let chart = new Chart(canvas, {
        type: "bar",
        data: {
            labels: coachesAndCounts.map(x => x[0]),
            datasets: [{
                label: "Classes",
                data: coachesAndCounts.map(x => x[1]),
                backgroundColor: "#ED7010",
            }],
        },
    });
}

function getLocationsAndCounts(rows) {
    let locationsAndCounts = {};
    for (row of rows) {
        let location = row[0];
        if (locationsAndCounts.hasOwnProperty(location)) {
            locationsAndCounts[location] += 1;
        } else {
            locationsAndCounts[location] = 1;
        }
    }
    locationsAndCounts = Object.entries(locationsAndCounts)
    .sort((a, b) => {
        let x = a[0];
        let y = b[0];
        if (x < y) {
            return -1;
        } else if (x > y) {
            return 1;
        } else {
            return 0;
        }
    })
    .reverse()
    .sort((a, b) => {
        let x = a[1];
        let y = b[1];
        if (x < y) {
            return -1;
        } else if (x > y) {
            return 1;
        } else {
            return 0;
        }
    })
    .reverse()
    return locationsAndCounts;
}

function showLocationsData(heading=null, rows=null) {
    hideAll();
    document.getElementById("graph_description").innerText = "Classes Per Location";
    document.getElementById("graph_container").hidden = false;
    document.getElementById("locations_data_container").hidden = false;
    document.getElementById("locations_table_container").hidden = false;
    document.getElementById("locations_stats_container").hidden = false;
    if (!heading || !rows) {
        heading = JSON.parse(localStorage["heading"]);
        rows = JSON.parse(localStorage["rows"]);
    }
    if (rows.length > 0) {
        let locationsAndCounts = getLocationsAndCounts(rows);
        drawLocationsBarChart(locationsAndCounts);
        removeAllChildren("locations_table_body");
        let locations = locationsAndCounts.map(x => x[0]);
        let counts = locationsAndCounts.map(x => x[1]);
        addIndependentVarsToTable(locations, "locations_table_body");
        addDependentVarsToTable(counts, "locations_table_body");
        document.getElementById("locations_total").innerText = rows.length;
    } else {
        document.getElementById("no_data_message_container").hidden = false;
        document.getElementById("graph_container").hidden = true;
    }
}

function drawLocationsBarChart(locationsAndCounts) {
    let canvas = document.getElementById("graph");
    Chart.getChart("graph")?.destroy();
    let chart = new Chart(canvas, {
        type: "bar",
        data: {
            labels: locationsAndCounts.map(x => x[0]),
            datasets: [{
                label: "Classes",
                data: locationsAndCounts.map(x => x[1]),
                backgroundColor: "#ED7010",
            }],
        },
    });
}

function getZonesTotals(rows) {
    let zonesTotals = [];
    for (let i = 0; i < 5; i++) {
        zonesTotals.push(0);
    }
    for (row of rows) {
        for (let i = 4, j = 0; i < 9; i++, j++) {
            zonesTotals[j] += parseInt(row[i]);
        }
    }
    return zonesTotals;
}

function showZonesTotalsData(heading=null, rows=null) {
    hideAll();
    document.getElementById("graph_description").innerText = "Total Minutes Per Zone";
    document.getElementById("graph_container").hidden = false;
    document.getElementById("zones_totals_table").hidden = false;
    if (!heading || !rows) {
        heading = JSON.parse(localStorage["heading"]);
        rows = JSON.parse(localStorage["rows"]);
    }
    if (rows.length > 0) {
        let zonesTotals = getZonesTotals(rows);
        drawZonesBarChart(zonesTotals);
        removeAllChildren("zones_totals_table_body");
        addZonesLabelsToTable("zones_totals_table_body");
        addZonesValuesToTable(zonesTotals.map(x => formatSeconds(x * 60)), "zones_totals_table_body");
    } else {
        document.getElementById("no_data_message_container").hidden = false;
        document.getElementById("graph_container").hidden = true;
    }
}

function getSeconds(time) {
    let timePattern = /(\d{1,2})\:(\d{2})/;
    let match = time.match(timePattern);
    let minutes = parseInt(match?.[1]);
    let seconds = parseInt(match?.[2]);
    seconds += minutes * 60;
    return seconds;
}

function showValueByTime(value, heading=null, rows=null) {
    hideAll();
    heading = heading ?? JSON.parse(localStorage["heading"]);
    rows = rows ?? JSON.parse(localStorage["rows"]);
    let prettyHeading = JSON.parse(localStorage["prettyHeading"]);
    let units = JSON.parse(localStorage["units"]);
    let valueIndex = heading.indexOf(value);
    let timeIndex = heading.indexOf("date");
    let title = units[valueIndex] ? prettyHeading[valueIndex].concat(" (", units[valueIndex], ")") : prettyHeading[valueIndex];
    document.getElementById("graph_description").innerText = title;
    let total = null;
    let timesAndValues = [];
    let isTimeValue = null;
    for (row of rows) {
        if (row[valueIndex]?.length > 0) {
            let value = null;
            if (isTimeValue == null) {
                let match = row[valueIndex].match(/\d{1,2}\:\d{2}/);
                isTimeValue = match ? true : false;
                if (isTimeValue) {
                    value = row[valueIndex];
                    total = getSeconds(value);
                } else {
                    if (row[valueIndex].includes(".")) {
                        value = parseFloat(row[valueIndex]);
                    } else {
                        value = parseInt(row[valueIndex]);
                    }
                    total = value;
                }
            } else if (isTimeValue) {
                value = row[valueIndex];
                total += getSeconds(value);
            } else {
                if (row[valueIndex].includes(".")) {
                    value = parseFloat(row[valueIndex]);
                } else {
                    value = parseInt(row[valueIndex]);
                }
                if (!total) {
                    total = value;
                } else {
                    total += value;
                }
            }
            timesAndValues.push([row[timeIndex], value]);
        }
    }
    if (timesAndValues.length > 0) {
        document.getElementById("options_selector_form_container").hidden = false;
        let hideOutsideStdDevs = document.getElementById("hide_outside_std_devs_selector").checked;
        let showRegression = document.getElementById("regression_selector").checked;
        document.getElementById("graph_container").hidden = false;
        document.getElementById("value_by_time_data_container").hidden = false;
        document.getElementById("value_by_time_table_container").hidden = false;
        document.getElementById("value_by_time_stats_container").hidden = false;
        let times = timesAndValues.map(x => x[0]);
        let values = timesAndValues.map(x => x[1]);
        let mean = null;
        let stdDev = null;
        let regressionData = null;
        if (isTimeValue) {
            total = formatSeconds(total);
            let valuesInSeconds = values.map(x => getSeconds(x));
            mean = getMean(valuesInSeconds);
            stdDev = getStdDev(valuesInSeconds, mean);
            let regressionYEnds = null;
            let graphTimes = [];
            let graphValues = [];
            if (hideOutsideStdDevs) {
                for (let i = 0; i < valuesInSeconds.length; i++) {
                    if (valuesInSeconds[i] >= mean - 3 * stdDev && valuesInSeconds[i] <= mean + 3 * stdDev) {
                        graphTimes.push(times[i]);
                        graphValues.push(valuesInSeconds[i]);
                    }
                }
            } else {
                graphTimes = times.slice();
                graphValues = valuesInSeconds.slice();
            }
            graphValues = graphValues.map(x => x / 60);
            if (showRegression && valuesInSeconds.length > 1) {
                regressionData = getRegressionData(valuesInSeconds);
                let regressionYEnds = regressionData.slice(2);
                drawChart(graphTimes, graphValues, mean / 60, stdDev / 60, regressionYEnds.map(x => x / 60));
            } else {
                drawChart(graphTimes, graphValues, mean / 60, stdDev / 60);
            }
            mean = formatSeconds(mean);
            stdDev = formatSeconds(stdDev);
        } else {
            mean = getMean(values, total);
            stdDev = getStdDev(values, mean);
            let graphTimes = [];
            let graphValues = [];
            if (hideOutsideStdDevs) {
                for (let i = 0; i < values.length; i++) {
                    if (values[i] >= mean - 3 * stdDev && values[i] <= mean + 3 * stdDev) {
                        graphTimes.push(times[i]);
                        graphValues.push(values[i]);
                    }
                }
            } else {
                graphTimes = times.slice();
                graphValues = values.slice();
            }
            if (showRegression && values.length > 1) {
                regressionData = getRegressionData(values);
                let regressionYEnds = regressionData.slice(2);
                drawChart(graphTimes, graphValues, mean, stdDev, regressionYEnds);
            } else {
                drawChart(graphTimes, graphValues, mean, stdDev);
            }
            if (!Number.isInteger(total)) {
                total = total.toFixed(2);
                mean = mean.toFixed(2);
                stdDev = stdDev.toFixed(2);
            } else {
                mean = Math.round(mean).toString();
                stdDev = Math.round(stdDev).toString();
            }
        }
        removeAllChildren("value_by_time_table_heading");
        addRow("value_by_time_table_heading", ["Date", title], true);
        removeAllChildren("value_by_time_table_body");
        addIndependentVarsToTable(times, "value_by_time_table_body");
        addDependentVarsToTable(values, "value_by_time_table_body");
        if (shouldDisplayTotal(valueIndex)) {
            document.getElementById("value_by_time_total_p").hidden = false;
            document.getElementById("value_by_time_total").innerText = total;
        } else {
            document.getElementById("value_by_time_total_p").hidden = true;
        }
        document.getElementById("value_by_time_mean").innerText = mean;
        document.getElementById("value_by_time_std_dev").innerText = stdDev;
        if (showRegression && values.length > 1) {
            document.getElementById("value_by_time_regression").hidden = false;
            document.getElementById("value_by_time_regression").innerHTML = `<b>Regression<b>: <i>f(x)</i> = ${regressionData[1].toFixed(2)} + ${regressionData[0].toFixed(2)}<i>x</i>`;
        } else {
            document.getElementById("value_by_time_regression").hidden = true;
        }
    } else {
        document.getElementById("no_data_message_container").hidden = false;
        document.getElementById("graph_container").hidden = true;
    }
}

function getRegressionData(yValues, xValues=null) {
    let minIndexXValues = maxIndexXValues = null;
    if (!xValues) {
        xValues = new Array(yValues.length);
        for (let i = 0; i < yValues.length; i++) {
            xValues[i] = i;
        }
        minIndexXValues = 0;
        maxIndexXValues = xValues.length - 1;
    } else {
        let minValue = xValues[0];
        let maxValue = xValues[0];
        minIndexXValues = 0;
        maxIndexXValues = 0;
        for (let i = 1; i < xValues.length; i++) {
            if (xValues[i] < minValue) {
                minValue = xValues[i];
                minIndexXValues = i;
            } else if (xValues[i] > maxValue) {
                maxValue = xValues[i];
                maxIndexXValues = i;
            }
        }
    }
    let xMean = getMean(xValues);
    let yMean = getMean(yValues);
    let sxy = 0;
    for (let i = 0; i < xValues.length; i++) {
        sxy += (xValues[i] - xMean) * (yValues[i] - yMean);
    }
    let sxx = 0;
    for (let i = 0; i < xValues.length; i++) {
        sxx += Math.pow((xValues[i] - xMean), 2);
    }
    let slope = sxy / sxx;
    let yIntercept = yMean - slope * xMean;
    let regressionData = new Array(4);
    regressionData[0] = slope;
    regressionData[1] = yIntercept;
    regressionData[2] = yIntercept + xValues[minIndexXValues] * slope;
    regressionData[3] = yIntercept + xValues[maxIndexXValues] * slope;
    return regressionData;
}

function shouldDisplayTotal(index) {
    let noDisplay = [0, 1, 2, 3, 11, 12, 16, 17, 18, 19, 20, 21, 25, 26, 27, 28, 29, 30, 31];
    if (!noDisplay.includes(index)) {
        return true;
    } else {
        return false;
    }
}

function addRow(id, cellValues, bold=false) {
    let tableElement = document.getElementById(id);
    let row = document.createElement("tr");
    for (let i = 0; i < cellValues.length; i++) {
        let cell = document.createElement("td");
        if (bold) {
            let bold = document.createElement("b");
            bold.innerText = cellValues[i];
            cell.appendChild(bold);
        } else {
            cell.innerText = cellValues[i];
        }
        row.appendChild(cell);
        tableElement.appendChild(row);
    }
}

function addIndependentVarsToTable(independentVars, tableBodyID) {
    let tableBody = document.getElementById(tableBodyID);
    for (let i = 0; i < independentVars.length; i++) {
        let row = document.createElement("tr");
        tableBody.appendChild(row);
        let cell = document.createElement("td");
        cell.innerText = independentVars[i];
        row.appendChild(cell);
    }
}

function addDependentVarsToTable(dependentVars, tableBodyID) {
    let tableBody = document.getElementById(tableBodyID);
    for (let i = 0; i < dependentVars.length; i++) {
        let row = tableBody.children[i];
        let cell = document.createElement("td");
        cell.innerText = dependentVars[i];
        row.appendChild(cell);
    }
}

function drawChart(independentVars, dependentVars, mean, stdDev, regressionYEnds=null) {
    let canvas = document.getElementById("graph");
    Chart.getChart("graph")?.destroy();
    if (regressionYEnds) {
        if (stdDev) {
            let chart = new Chart(canvas, {
                type: "line",
                data: {
                    labels: independentVars,
                    datasets: [{
                        data: dependentVars,
                        backgroundColor: "#ED7010",
                        showLine: false,
                    }],
                },
                options: {
                    plugins: {
                        annotation: {
                            annotations: {
                                meanAnnotation: {
                                    type: "line",
                                    borderColor: "#DF10ED",
                                    yMin: mean,
                                    yMax: mean,
                                },
                                stdDevAboveAnnotation: {
                                    type: "line",
                                    borderColor: "#108DED",
                                    yMin: mean + stdDev,
                                    yMax: mean + stdDev,
                                },
                                stdDevBelowAnnotation: {
                                    type: "line",
                                    borderColor: "#108DED",
                                    yMin: mean - stdDev,
                                    yMax: mean - stdDev,
                                },
                                regressionAnnotation: {
                                    type: "line",
                                    borderColor: "#10ED70",
                                    yMin: regressionYEnds[0], // yMin attribute does not necessarily indicate ymin, rather y value at first endpoint
                                    yMax: regressionYEnds[1], // yMax attribute does not necessarily indicate ymax, rather y value at second endpoint
                                }
                            },
                        },
                        legend: {
                            display: false,
                        }
                    },
                },
            });
        } else {
            let chart = new Chart(canvas, {
                type: "line",
                data: {
                    labels: independentVars,
                    datasets: [{
                        data: dependentVars,
                        backgroundColor: "#ED7010",
                        showLine: false,
                    }],
                },
                options: {
                    plugins: {
                        annotation: {
                            annotations: {
                                meanAnnotation: {
                                    type: "line",
                                    borderColor: "#DF10ED",
                                    yMin: mean,
                                    yMax: mean,
                                },
                                regressionAnnotation: {
                                    type: "line",
                                    borderColor: "#10ED70",
                                    yMin: regressionYEnds[0], // yMin attribute does not necessarily indicate ymin, rather y value at first endpoint
                                    yMax: regressionYEnds[1], // yMax attribute does not necessarily indicate ymax, rather y value at second endpoint
                                }
                            },
                        },
                        legend: {
                            display: false,
                        }
                    },
                },
            });
        }
    } else {
        if (stdDev) {
            let chart = new Chart(canvas, {
                type: "line",
                data: {
                    labels: independentVars,
                    datasets: [{
                        data: dependentVars,
                        backgroundColor: "#ED7010",
                        showLine: false,
                    }],
                },
                options: {
                    plugins: {
                        annotation: {
                            annotations: {
                                meanAnnotation: {
                                    type: "line",
                                    borderColor: "#DF10ED",
                                    yMin: mean,
                                    yMax: mean,
                                },
                                stdDevAboveAnnotation: {
                                    type: "line",
                                    borderColor: "#108DED",
                                    yMin: mean + stdDev,
                                    yMax: mean + stdDev,
                                },
                                stdDevBelowAnnotation: {
                                    type: "line",
                                    borderColor: "#108DED",
                                    yMin: mean - stdDev,
                                    yMax: mean - stdDev,
                                },
                            },
                        },
                        legend: {
                            display: false,
                        }
                    },
                },
            });
        } else {
            let chart = new Chart(canvas, {
                type: "line",
                data: {
                    labels: independentVars,
                    datasets: [{
                        data: dependentVars,
                        backgroundColor: "#ED7010",
                        showLine: false,
                    }],
                },
                options: {
                    plugins: {
                        annotation: {
                            annotations: {
                                meanAnnotation: {
                                    type: "line",
                                    borderColor: "#DF10ED",
                                    yMin: mean,
                                    yMax: mean,
                                },
                            },
                        },
                        legend: {
                            display: false,
                        }
                    },
                },
            });
        }
    }
}

function addSelector(value, prettyValue, containerID) {
    let container = document.getElementById(containerID);
    let radioInput = document.createElement("input");
    radioInput.type = "radio";
    radioInput.id = value.concat("_selector");
    radioInput.name = "data_selector";
    radioInput.value = value;
    radioInput.addEventListener("click", display);
    container.appendChild(radioInput);
    let label = document.createElement("label");
    label.htmlFor = radioInput.id;
    label.innerText = " ".concat(prettyValue);
    container.appendChild(label);
    container.appendChild(document.createElement("br"));
}

function showValueByTimeSelectors(heading=null, rows=null) {
    let mainSelectorsCntr = document.getElementById("graph_selector_form_main");
    let treadmillSelectorsCntr = document.getElementById("graph_selector_form_treadmill");
    let rowerSelectorsCntr = document.getElementById("graph_selector_form_rower");
    if (!heading || !rows) {
        heading = JSON.parse(localStorage["heading"]);
        rows = JSON.parse(localStorage["rows"]);
    }
    let prettyHeading = null;
    if (!localStorage["prettyHeading"]) {
        prettyHeading = getPrettyHeading(heading);
        localStorage["prettyHeading"] = JSON.stringify(prettyHeading);
    } else {
        prettyHeading = JSON.parse(localStorage["prettyHeading"]);
    }
    if (Array.from(mainSelectorsCntr.children).reduce(((acc, x) => (x.type == "radio") ? acc + 1 : acc), 0) <= 4) {
        for (let i = 9; i < 13; i++) {
            addSelector(heading[i], prettyHeading[i], "graph_selector_form_main");
        }
    }
    if (treadmillSelectorsCntr.children.length == 0) {
        for (let i = 13; i < heading.length; i++) {
            if (heading[i].includes("treadmill")) {
                addSelector(heading[i], prettyHeading[i].replace("Treadmill ", ""), "graph_selector_form_treadmill");
            }
        }
    }
    if (rowerSelectorsCntr.children.length == 0) {
        for (let i = 13; i < heading.length; i++) {
            if (heading[i].includes("rower")) {
                addSelector(heading[i], prettyHeading[i].replace("Rower ", ""), "graph_selector_form_rower");
            }
        }
    }
}

function isLeapYear(year) {
    if (year % 4 == 0 && (year % 100 != 0 || (year % 100 == 0 && year % 400 == 0))) {
        return true;
    } else {
        return false;
    }
}

function getOneYearAgo(date) {
    let day = date.getDate();
    let month = date.getMonth();
    let year = date.getFullYear();
    if (day == 29 && month == 1 && isLeapYear(year)) {
        day = 28;
    }
    year--;
    let newDate = new Date();
    newDate.setFullYear(year);
    newDate.setMonth(month);
    newDate.setDate(day);
    return newDate;
}

function getOneMonthAgo(date) {
    let day = date.getDate();
    let month = date.getMonth();
    let year = date.getFullYear();
    let dayCounts = {
        0: 31,
        1: 28,
        2: 31,
        3: 30,
        4: 31,
        5: 30,
        6: 31,
        7: 31,
        8: 30,
        9: 31,
        10: 30,
        11: 31,
    }
    let previousMonth = month - 1;
    let previousYear = year;
    if (previousMonth == -1) {
        previousMonth = 11;
        previousYear--;
    }
    let previousDay = day;
    if (day > dayCounts[previousMonth]) {
        if (previousMonth == 1 && isLeapYear(year)) {
            previousDay = 29;
        } else {
            previousDay = dayCounts[previousMonth];
        }
    }
    let newDate = new Date();
    newDate.setFullYear(previousYear);
    newDate.setMonth(previousMonth);
    newDate.setDate(previousDay);
    return newDate;
}

function getOneWeekAgo(date) {
    let day = date.getDate();
    let month = date.getMonth();
    let year = date.getFullYear();
    let dayCounts = {
        0: 31,
        1: 28,
        2: 31,
        3: 30,
        4: 31,
        5: 30,
        6: 31,
        7: 31,
        8: 30,
        9: 31,
        10: 30,
        11: 31,
    }
    if (day < 7) {
        month--;
        if (month == -1) {
            month = 11;
            year--;
        }
        if (month == 1 && isLeapYear(year)) {
            day = 29 - (7 - day);
        } else {
            day = dayCounts[month] - (7 - day);
        }
    } else {
        day -= 7;
    }
    let newDate = new Date();
    newDate.setFullYear(year);
    newDate.setMonth(month);
    newDate.setDate(day);
    return newDate;
}

function getOneDayAgo(date) {
    let day = date.getDate();
    let month = date.getMonth();
    let year = date.getFullYear();
    let dayCounts = {
        0: 31,
        1: 28,
        2: 31,
        3: 30,
        4: 31,
        5: 30,
        6: 31,
        7: 31,
        8: 30,
        9: 31,
        10: 30,
        11: 31,
    }
    if (day == 1) {
        month--;
        if (month == -1) {
            month = 11;
            year--;
        }
        if (month == 1 && isLeapYear(year)) {
            day = 29;
        } else {
            day = dayCounts[month];
        }
    } else {
        day--;
    }
    let newDate = new Date();
    newDate.setFullYear(year);
    newDate.setMonth(month);
    newDate.setDate(day);
    return newDate;
}

function display() {
    let periodSelector = null;
    let periodSelectorForm = document.getElementById("period_selector_form");
    for (child of periodSelectorForm) {
        if (child.type == "radio" && child.checked) {
            periodSelector = child;
            break;
        }
    }
    let currentDate = new Date();
    let rows = JSON.parse(localStorage["rows"]);
    if (periodSelector.value == "past_year") {
        let date = getOneYearAgo(currentDate);
        rows = rows.filter((row) => {
            let rowDateMatch = row[1].match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
            let year = parseInt(rowDateMatch[3]);
            let month = parseInt(rowDateMatch[1]) - 1;
            let day = parseInt(rowDateMatch[2]);
            let rowDate = new Date();
            rowDate.setFullYear(year);
            rowDate.setMonth(month);
            rowDate.setDate(day);
            let dateComparison = compareDates(rowDate, date);
            return dateComparison == 0 || dateComparison == 1;
        });
    } else if (periodSelector.value == "past_month") {
        let date = getOneMonthAgo(currentDate);
        rows = rows.filter((row) => {
            let rowDateMatch = row[1].match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
            let year = parseInt(rowDateMatch[3]);
            let month = parseInt(rowDateMatch[1]) - 1;
            let day = parseInt(rowDateMatch[2]);
            let rowDate = new Date();
            rowDate.setFullYear(year);
            rowDate.setMonth(month);
            rowDate.setDate(day);
            let dateComparison = compareDates(rowDate, date);
            return dateComparison == 0 || dateComparison == 1;
        });
    } else if (periodSelector.value == "past_week") {
        let date = getOneWeekAgo(currentDate);
        rows = rows.filter((row) => {
            let rowDateMatch = row[1].match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
            let year = parseInt(rowDateMatch[3]);
            let month = parseInt(rowDateMatch[1]) - 1;
            let day = parseInt(rowDateMatch[2]);
            let rowDate = new Date();
            rowDate.setFullYear(year);
            rowDate.setMonth(month);
            rowDate.setDate(day);
            let dateComparison = compareDates(rowDate, date);
            return dateComparison == 0 || dateComparison == 1;
        });
    } else if (periodSelector.value == "past_day") {
        let date = getOneDayAgo(currentDate);
        rows = rows.filter((row) => {
            let rowDateMatch = row[1].match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
            let year = parseInt(rowDateMatch[3]);
            let month = parseInt(rowDateMatch[1]) - 1;
            let day = parseInt(rowDateMatch[2]);
            let rowDate = new Date();
            rowDate.setFullYear(year);
            rowDate.setMonth(month);
            rowDate.setDate(day);
            let dateComparison = compareDates(rowDate, date);
            return dateComparison == 0 || dateComparison == 1;
        });
    } else if (periodSelector.value == "last_workout") {
        rows = rows.length > 0 ? [rows[rows.length - 1]] : [];
    }
    let dataSelector = null;
    let graphSelectorForm = document.getElementById("graph_selector_form");
    for (child of graphSelectorForm) {
        if (child.type == "radio" && child.checked) {
            dataSelector = child;
            break;
        }
    }
    let heading = JSON.parse(localStorage["heading"]);
    if (dataSelector.value == "zones_averages") {
        showZonesAveragesData(heading, rows);
    } else if (dataSelector.value == "zones_totals") {
        showZonesTotalsData(heading, rows);
    } else if (dataSelector.value == "coaches") {
        showCoachesData(heading, rows);
    } else if (dataSelector.value == "locations") {
        showLocationsData(heading, rows);
    } else {
        showValueByTime(dataSelector.value, heading, rows);
    }
}

function main() {
    let fileInput = document.getElementById("file_input");
    fileInput.addEventListener("change", getNewData);
    let clearButton = document.getElementById("clear_previous_data_button");
    clearButton.onclick = clearPreviousData;
    for (child of document.getElementById("graph_selector_form")) {
        if (child.type == "radio") {
            child.addEventListener("click", display);
        }
    }
    for (child of document.getElementById("period_selector_form")) {
        if (child.type == "radio") {
            child.addEventListener("click", display);
        }
    }
    document.getElementById("hide_outside_std_devs_selector").addEventListener("click", (() => display()));
    document.getElementById("regression_selector").addEventListener("click", (() => display()));
    let date = new Date();
    if (!localStorage["updateDate"]) {
        localStorage["updateDate"] = JSON.stringify(date);
    } else {
        if (new Date(JSON.stringify(localStorage["updateDate"])).getTime() != date.getTime()) {
            localStorage["updateDate"] = JSON.stringify(date);
        }
    }
    if (!localStorage["units"]) {
        localStorage["units"] = JSON.stringify(getUnits());
    }
    if (localStorage["heading"] && localStorage["rows"]) {
        let heading = JSON.parse(localStorage["heading"]);
        let rows = JSON.parse(localStorage["rows"]);
        document.getElementById("error_message_container").hidden = true;
        document.getElementById("analysis_container").hidden = false;
        document.getElementById("zones_averages_selector").checked = true;
        document.getElementById("period_all_time_selector").checked = true;
        document.getElementById("hide_outside_std_devs_selector").checked = false;
        document.getElementById("regression_selector").checked = false;
        showValueByTimeSelectors(heading, rows);
        showZonesAveragesData(heading, rows);
        showAllDataTable(heading, rows);
    }
}

main();
