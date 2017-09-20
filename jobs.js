var height = 500;
var width = 900;
var padding = 50;

var stateTimeseries;

function plotJobs(stateTimeseries) {
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
		{state: "WI", color: "darkorange"}, {state: "PA", color: "khaki"}];

	svg.append("text")
	.attr("x", 140)
	.attr("y", 85)
	.attr("alignment-baseline", "middle")
	.attr("text-anchor", "start")
	.style("font-family", "'Montserrat', sans-serif")
	.style("fill", "#FF8811")
	.text("Ohio");

	svg.append("text")
	.attr("x", 140)
	.attr("y", 150)
	.attr("alignment-baseline", "middle")
	.attr("text-anchor", "start")
	.style("font-family", "'Montserrat', sans-serif")
	.style("fill", "#392F5A")
	.text("Pennsylvania");

	svg.append("text")
	.attr("x", 140)
	.attr("y", 240)
	.attr("alignment-baseline", "middle")
	.attr("text-anchor", "start")
	.style("font-family", "'Montserrat', sans-serif")
	.style("fill", "#9DD9D2")
	.text("Michigan");

	svg.append("text")
	.attr("x", 140)
	.attr("y", 410)
	.attr("alignment-baseline", "middle")
	.attr("text-anchor", "start")
	.style("font-family", "'Montserrat', sans-serif")
	.style("fill", "#F0E68C")
	.text("Wisconsin");

	var line = d3.line()
	.x(function (d) { return xScale(d.date); })
	.y(function (d) { return yScale(d.jobs); });

	stateTimeseries.forEach(function (d) {
		svg.append("path")
		.attr("d", line(d.values))
		.style("stroke", function () {
			if (d.key == "MI")
				return "#9DD9D2";
			if (d.key == "OH")
				return "#FF8811";
			if (d.key == "WI")
				return "#F0E68C";
			return "#392F5A"
		})
		.style("stroke-width", 2)
		.style("fill", "none")
		.style("cursor", "pointer")
		.on("mouseenter", function () {
			d3.select(this).transition()
			.style("stroke-width", 4);
		})
		.on("mouseleave", function() {
			d3.select(this).transition()
			.style("stroke-width", 2);
		});
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

var selectedStates = ["MI", "OH", "WI", "PA"];

function isSelected(d) {
	if (selectedStates.indexOf(d.key) != -1) {
		return true;
	}
	return false;
}

d3.tsv("manufacturing.txt", parseLine, function (error, data) {
	stateTimeseries = d3.nest().key(function (d) { return d.state; }).entries(data);

	stateTimeseries = stateTimeseries.filter(isSelected);
		
	stateTimeseries.forEach(function (d) {
		var values = d.values;

		var jobs = [];
		values.forEach(function (d) {
			jobs.push(d.jobs);
		});

		values.forEach(function (d, i) {
			if (i != 0 && i != values.length - 1)
				d.jobs = (jobs[i - 1] + d.jobs + jobs[i + 1]) / 3;
		});

		values.forEach(function (d, i) {
			(i == 0) ? d.v = 0 : d.v = d.jobs - values[i - 1].jobs;
		});
		
		var v = [];
		values.forEach(function (d) {
			v.push(d.v);
		});

		values.forEach(function (d, i) {
			if (i != 0 && i != values.length - 1)
				d.v = (v[i - 1] + d.v + v[i + 1]) / 3;
		});
	});
	
	plotJobs(stateTimeseries);
	plotJobChange(stateTimeseries);
});
