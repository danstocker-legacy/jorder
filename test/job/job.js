////////////////////////////////////////////////////////////////////////////////
// jOrder Benchmark
// Simple JS code benchmarking framework
// Requires jQuery
////////////////////////////////////////////////////////////////////////////////
/*global jQuery */

var jOB = function ($) {
	var benchmarks = [],	// all benchmarks
			self;

	// converts argument list to actual array
	function argumentsToArray(args) {
		var result = [],
				i;
		for (i = 0; i < args.length; i++) {
			result.push(args[i]);
		}
		return result;
	}
			
	// processes a row
	function process(row, handler) {
		if (typeof row === 'string') {
			return handler('string', row);
		}
		
		var result = [],
				field;
		for (field in row) {
			if (row.hasOwnProperty(field)) {
				result.push(handler(field, row[field]));
			}
		}
		return result.join('');
	}

	// 'process' handler for data cell
	function cellHandler(field, value) {
		return '<td>' + value + '</td>';
	}

	// adding toolbar
	$(function () {
		$(['<label for="job-count">Test cycles: </label>',
			'<select id="job-count">',
			'<option value="1">1</option>',
			'<option value="10" selected="selected">10</option>',
			'<option value="100">100</option>',
			'<option value="1000">1000</option>',
			'</select>',
			'<label for="job-timeout">Timeout: </label>',
			'<select id="job-timeout">',
			'<option value="1000" selected="selected">1 sec</option>',
			'<option value="5000">5 secs</option>',
			'</select>',
			'<input id="job-estimate" type="checkbox" checked="checked" />',
			'<label for="job-estimate">Estimate on timeout</label>',
			'</div>'
		].join(''))
			.appendTo($('#job-toolbar'));
			
		// adding toolbar events
		$('#job-count').change(function () {
			self.count = $(this).val();
		});
		$('#job-timeout').change(function () {
			self.timeout = $(this).val();
		});
		$('#job-estimate').click(function () {
			self.estimate = $(this).is(':checked');
		});
		
		self.start();
	});
	
	self = {
		// properties
		count: 10,				// number of times to run at once
		timeout: 1000,		// test timeout in ms
		estimate: true,		// whether to project timed out test durations
		
		// registers a benchmark
		// - desc: describes the benchmark
		// - labels: labels for each candidate
		benchmark: function (desc /*, labels */) {
			benchmarks.push({desc: desc, labels: argumentsToArray(arguments).slice(1), tests: []});
		},
		
		// runs a test and measures time
		// - message to be displayed for test
		// - handlers: test to run 'count' times
		//	 expected to return a json table
		// - options
		test: function (message /*, handlers..., options */) {
			var benchmark = benchmarks[benchmarks.length - 1],
					candidates,
					options,
					args = argumentsToArray(arguments);
			if (typeof args[args.length - 1] === 'object') {
				options = args[args.length - 1];
				candidates = args.slice(1, args.length - 1);
			} else {
				candidates = args.slice(1);
			}
			if (benchmark) {
				benchmark.tests.push({message: message, handlers: candidates, options: options});
			}
		},

		// builds a table with result data
		build: function (json) {
			$('#job-results')
				.empty()
				.append([
					'<colgroup>',			
					process(json[0], function (field, value) {
						return '<col class="' + field + '"></col>';
					}),
					'</colgroup>',
					'<thead>',
					'<tr>',
					process(json[0], function (field, value) {
						return '<th>' + field + '</th>';
					}),				
					'</tr>',
					'</thead>',
					'<tbody>',
					function () {
						var result = [],
								i;
						for (i = 0; i < json.length; i++) {
							result.push('<tr>' + process(json[i], cellHandler) + '</tr>');
						}
						return result.join('');
					}(),
					'</tbody>'
				].join(''));
		},

		// builds table for one set of tests (benchmark)
		start: function () {
			$('#job-benchmarks').append(function () {
				var result = [],
						j, benchmark,
						i, test;
				for (j = 0; j < benchmarks.length; j++) {
					benchmark = benchmarks[j];
					
					// adding benchmark title
					result.push([
						'<h3>', benchmark.desc, '</h3>',
						'<table>'
					].join(''));
					
					// adding benchmark header
					if (benchmark.labels.length) {
						result.push([
							'<thead>',
							'<tr>',
							'<td></td>',
							'<td></td>'
						].join(''));
						// adding labels
						for (i = 0; i < benchmark.labels.length; i++) {
							result.push([
								'<td>',
								benchmark.labels[i],
								'</td>'
							].join(''));
						}
						result.push([
							'</tr>',
							'</thead>'
						].join(''));
					}
					
					// adding tests
					result.push('<tbody>');
					for (i = 0; i < benchmark.tests.length; i++) {
						test = benchmark.tests[i];
						result.push([
							'<tr id="job-', j, '-', i, '">',
							'<td class="job-desc">', test.message, '</td>',
							'<td class="job-button"><input class="job-run" type="button" value="&#8594;" /></td>',
							// adding result cells for each candidate
							(function () {
								var result = [],
										handlers = test.handlers,
										k;
								for (k = 0; k < handlers.length; k++) {
									result.push('<td id="job-' + [j, i, k].join('-') + '" class="job-result"></td>');
								}
								return result.join('');
							}()),
							'<td class="job-arrow"></td>',
							'</tr>'
						].join(''));
					}
					result.push([
						'</tbody>',
						'</table>'
					].join(''));
				}
				return result.join('');
			}());
		}
	};
	
	// runs test
	function run(b, t, c) {
		var result,
				test = benchmarks[b].tests[t],
				start, end,
				i,
				$target = $(['#job', b, t, c].join('-')),
				unit = 'ms';
		
		$target.attr('title', test.handlers[c] ? test.handlers[c].toString() : "N/A");
		
		// running test function
		start = new Date();
		for (i = 0; i < self.count; i++) {
			if (test.handlers[c] === null) {
				$target.text("N/A");
				return;
			}
			result = test.handlers[c](i);
			if (self.timeout < new Date() - start) {
				break;
			}
		}
		end = new Date();

		// handling timeout
		if (i < self.count) {
			// adding timeout value (% or estimation)
			$target.text(self.estimate ?
				String(Math.floor(self.timeout * self.count / i)) + unit :
				"timeout (" + Math.floor(100 * i / self.count) + "%)");
		} else {
			// adding duration
			$target.text(String(end - start) + unit);
		}
	}
	
	// displays result table
	function display(b, t, c) {
		var test = benchmarks[b].tests[t],
				$tr = $(['#job', b, t].join('-')),
				$tbody = $tr.closest('tbody'),
				result = test.handlers[c]();

		// hiding all other arrows
		$('td.job-arrow')
			.empty();

		// displaying arrow
		$tr.find('.job-arrow')
			.html('<span>&#8594;</span>')
		.end();
			
		// building result table
		self.build(test.options && test.options.lengthonly ? [{ length: result.length }] : result);

		// aligning result table to benchmark header
		$('#job-results')
			.css('top', $tbody.offset().top);				
	}
	
	// events
	$('input.job-run').live('click', function () {
		var $this = $(this),
				$tr = $this.closest('tr'),
				id = $tr.attr('id').split('-').slice(1),
				test = benchmarks[id[0]].tests[id[1]],
				i;
		
		// running before 
		if (test.options && typeof test.options.before === 'function') {
			test.options.before();
		}
		
		// running tests on all candidates		
		for (i = 0; i < test.handlers.length; i++) {
			run(id[0], id[1], i);
		}
	});
	
	$('td.job-result').live('click', function () {
		var $this = $(this),
				id;
			
		if (!$(this).contents().length) {
			return;
		}
			
		id = $(this).attr('id').split('-').slice(1);
		display(id[0], id[1], id[2]);
		
		$('td.job-result').removeClass('job-active');
		$this.addClass('job-active');
	});
	
	return self;
}(jQuery);

