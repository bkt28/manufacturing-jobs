var height = 500;
var width = 800;
var padding = 75;

// A useful variable reference outside the scope of the tsv callback.
var stateTimeseries;

// Plot the employment timeseries for each selected state from 1990 to 2016
function plotJobs(stateTimeseries) {
	// Define scales, axes.
	// Add <path> elements for NY, TN, WA, OH
	// Add <text> labels for all states at the right margin.
	
	var svg = d3.select("#jobsPlot").append("svg")
	.attr("width", width)
	.attr("height", height);

	var xScale = d3.scaleLinear().domain([new Date("1990-01-01"),
		new Date("2016-02-01")]).range([padding, width - padding]);

	var maxJobs = d3.max(stateTimeseries, function (d) {
		return d3.max(d.values, function (d) {
			return d.jobs;
		});
	});

	var minJobs = d3.min(stateTimeseries, function (d) {
		return d3.min(d.values, function (d) {
			return d.jobs;
		});
	});

	var yScale = d3.scaleLinear().domain([minJobs, maxJobs])
	.range([height - padding, padding]);

	var xAxis = d3.axisBottom().scale(xScale)
	.tickFormat(d3.timeFormat("%Y"));

	svg.append("g")
	.attr("class", "axis")
	.attr("transform", "translate(0, " + yScale(minJobs) + ")")
	.call(xAxis);

	var yAxis = d3.axisLeft().scale(yScale);
	svg.append("g")
	.attr("class", "axis")
	.attr("transform", "translate(" + padding + ", 0)")
	.call(yAxis);

	var states = [{state: "MI", color: "magenta"}, {state: "OH", color: "cyan"},
		{state: "WI", color: "darkorange"}, {state: "PA", color: "#777777"}];

	for (var i = 0; i < 4; i++) {
		svg.append("line")
		.attr("x1", width - padding * 2 - 30)
		.attr("x2", width - padding - 30)
		.attr("y1", padding + 20 * i)
		.attr("y2", padding + 20 * i)
		.style("stroke", function () { return states[i].color; })
		.style("stroke-width", 2)
		.style("fill", "none");

		svg.append("text")
		.attr("x", width - padding - 20)
		.attr("y", padding + 20 * i)
		.attr("alignment-baseline", "middle")
		.attr("text-anchor", "start")
		.style("font-family", "'Montserrat', sans-serif")
		.text(function () { return states[i].state; });
	}

	var line = d3.line()
	.x(function (d) { return xScale(d.date); })
	.y(function (d) { return yScale(d.jobs); });

	stateTimeseries.forEach(function (d) {
		svg.append("path")
		.attr("d", line(d.values))
		.style("stroke", function () {
			if (d.key == "MI")
				return "cyan";
			if (d.key == "OH")
				return "darkorange";
			if (d.key == "WI")
				return "#777777";
			return "magenta"
		})
		.style("stroke-width", 2)
		.style("fill", "none");
	});

	svg.append("text")
	.attr("x", width - padding)
	.attr("y", height)
	.attr("alignment-baseline", "top")
	.attr("text-anchor", "end")
	.style("font-family", "'Montserrat', sans-serif")
	.style("font-size", "10px")
	.style("fill", "#777777")
	.text("SOURCE: BUREAU OF LABOR STATISTICS");
}

// Parse incoming data appropriately: numbers as numbers, dates as Dates.
function parseLine(row) {
	return {
		series: row["Series"],
		state: row["State"],
		date: Date.parse(row["Date"]),
		jobs: Number(row["Jobs"])
	};
}

var formatter = d3.format(".4f");
var scaleX = d3.scaleLinear().domain([new Date("1990-01-01"),
	new Date("2016-02-01")]).range([0, width]);

//var selectedStates = ["NY", "TN", "OH", "WA"];
var selectedStates = ["MI", "OH", "WI", "PA"];

function isSelected(d) {
	if (selectedStates.indexOf(d.key) != -1) {
		return true;
	}
	return false;
}

d3.tsv("manufacturing.txt", parseLine, function (error, data) {
	stateTimeseries = d3.nest().key(function (d) { return d.state; }).entries(data);

	// Filter the data to include only selected states
	stateTimeseries = stateTimeseries.filter(isSelected);
		
	stateTimeseries.forEach(function (d) {
		var values = d.values;
		
		// Add smoothing. For each object in the time series, set the Jobs variable
		// to the average of the previous value, the current value, and the next value.
		// Do not modify the first and last objects.

		var jobs = [];
		values.forEach(function (d) {
			jobs.push(d.jobs);
		});

		values.forEach(function (d, i) {
			if (i != 0 && i != values.length - 1)
				d.jobs = (jobs[i - 1] + d.jobs + jobs[i + 1]) / 3;
		});
		
		// Calculate the "velocity" of jobs. For each object in the time series,
		// add a variable "v" that is the difference between the current Jobs value
		// and the previous value. Set v for the first object to 0.

		values.forEach(function (d, i) {
			(i == 0) ? d.v = 0 : d.v = d.jobs - values[i - 1].jobs;
		});

		// Add smoothing to the "v" values, in the same way you did for the Jobs
		// values above.
		
		var v = [];
		values.forEach(function (d) {
			v.push(d.v);
		});

		values.forEach(function (d, i) {
			if (i != 0 && i != values.length - 1)
				d.v = (v[i - 1] + d.v + v[i + 1]) / 3;
		});
	});
	
	// Create two plots.
	plotJobs(stateTimeseries);
	plotJobChange(stateTimeseries);
});
