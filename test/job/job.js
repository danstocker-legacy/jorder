////////////////////////////////////////////////////////////////////////////////
// jOrder Benchmark
// Simple JS code benchmarking framework
// Requires jQuery
////////////////////////////////////////////////////////////////////////////////
/*global jQuery */

var jOB = function ($) {
	var benchmarks = [],	// all benchmarks
			self;

	// processes a row
	function process(row, handler) {
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
		benchmark: function (desc) {
			benchmarks.push({desc: desc, tests: []});
		},
		
		// runs a test and measures time
		// -message to be displayed for test
		// -handler: test to run 'count' times
		//	expected to return a json table
		test: function (message, handler, options) {
			var benchmark = benchmarks[benchmarks.length - 1];
			if (benchmark) {
				benchmark.tests.push({message: message, handler: handler, options: options});
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

		// builds a table containing 		
		start: function () {
			$('#job-benchmarks').append([
				'<colgroup>',
				'<col class="job-desc">',
				'<col class="job-button">',
				'<col class="job-result">',
				'<col class="job-arrow">',
				'</colgroup>',
				(function () {
					var result = [],
							j, benchmark,
							i, test;
					for (j = 0; j < benchmarks.length; j++) {
						benchmark = benchmarks[j];
						// benchmark header
						result.push([
							'<tbody>',
							'<tr>',
							'<th colspan="3">', benchmark.desc, '</th>',
							'</tr>'
						].join(''));
						// tests
						for (i = 0; i < benchmark.tests.length; i++) {
							test = benchmark.tests[i];
							result.push([
								'<tr id="job-', j, '-', i, '">',
								'<td>', test.message, '</td>',
								'<td><input class="job-run" type="button" value="&#8594;" /></td>',
								'<td class="job-result"></td>',
								'<td class="job-arrow"></td>',
								'</tr>'
							].join(''));
						}
						result.push('</tbody>');
					}
					return result.join('');
				}()),
				'</tbody>'
			].join(''));
		}
	};
	
	// events
	$('input.job-run').live('click', function () {
		var $this = $(this),
				$tr = $this.closest('tr'),
				$tbody = $this.closest('tbody'),
				id = $tr.attr('id').split('-'),
				test = benchmarks[id[1]].tests[id[2]],
				i,
				start = new Date(), end,
				unit = 'ms',
				result;
	
		// running test function
		for (i = 0; i < self.count; i++) {
			result = test.handler();
			if (self.timeout < new Date() - start) {
				break;
			}
		}
		end = new Date();
		
		// removing all arrows
		$('td.job-arrow')
			.empty();
				
		// handling timeout
		if (i < self.count) {
			// adding timeout value (% or estimation)
			$tr
				.find('.job-result')
					.text(self.estimate ?
						String(Math.floor(self.timeout * self.count / i)) + unit :
						"timeout (" + Math.floor(100 * i / self.count) + "%)")
				.end();

			// hiding result table
			$('#job-results')
				.hide();
			return;
		} else {
			// adding duration and arrow
			$tr
				.find('.job-result')
					.text(String(end - start) + unit)
				.end()
				.find('.job-arrow')
					.html('<span>&#8594;</span>')
				.end();
				
			// aligning result table to benchmark header
			$('#job-results')
				.css('top', $tbody.offset().top);		

			// building result table
			self.build(test.options && test.options.lengthonly ? [{ length: result.length }] : result);
		}
	});
	
	return self;
}(jQuery);

