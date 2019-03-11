const http = require('http')
const { execSync } = require('child_process');
const formidable = require('formidable');
const fs = require('fs');

const RESULTS_DIRNAME = './results';
const SUBMISSION_FILENAME = 'submissions.txt';
NUM_PROBLEMS = 6;
SOLUTIONS = new Array(NUM_PROBLEMS).fill('').map((_, i) => `./answers/${(i + 1).toString()}.txt`);
SORT_ANSWERS = new Array(NUM_PROBLEMS).fill(false);
DEFAULT_SCORES = new Array(NUM_PROBLEMS).fill(3000);
DEFAULT_CORRECTNESS = new Array(NUM_PROBLEMS).fill(false);
const VANDYAPPS =	" __      __             _                                \n \\ \\    / /            | |         /\\                    \n  \\ \\  / /_ _ _ __   __| |_   _   /  \\   _ __  _ __  ___ \n   \\ \\/ / _` | '_ \\ / _` | | | | / /\\ \\ | '_ \\| '_ \\/ __|\n    \\  / (_| | | | | (_| | |_| |/ ____ \\| |_) | |_) \\__ \\ \n     \\/ \\__,_|_| |_|\\__,_|\\__, /_/    \\_\\ .__/| .__/|___/\n                           __/ |        | |   | |        \n                          |___/         |_|   |_|        \n";
const CODEGOLF =	"   _____          _         _____       _  __ \n  / ____|        | |       / ____|     | |/ _|\n | |     ___   __| | ___  | |  __  ___ | | |_ \n | |    / _ \\ / _` |/ _ \\ | | |_ |/ _ \\| |  _|\n | |___| (_) | (_| |  __/ | |__| | (_) | | |  \n  \\_____\\___/ \\__,_|\\___|  \\_____|\\___/|_|_|  \n                                              \n";
const YEAR =	"  ___   ___  __ ______ \n |__ \\ / _ \\/_ |____  |\n    ) | | | || |   / / \n   / /| | | || |  / /  \n  / /_| |_| || | / /   \n |____|\\___/ |_|/_/    \n                       \n\n\n";
const stylesheet = `
* {
	margin: 0;
	box-sizing: border-box;
	font-family: "Courier New", Courier, monospace;
}
body {
	background-color: ghostwhite;
	margin: 0px 10px;
}
header {
	padding: 10px;
	border-bottom: solid 1px black;
}

header > h1 {
	text-align: center;
}

.main {
	margin: 10px;
}

.inline {
	display: inline-block;
}

.inline div {
	padding: 0 10 0 0;
}

.small {
	width: 40px;
	padding: 0;
}

.sub-div {
	margin: 10px 20px;

}

.form {
	padding: 10px 10px;
}

#error-text {
	visibility: hidden;
}

#error-text p {
	color: red;
}

input[type="checkbox"]{
	margin: 0 0 0 5;
}

#timer {
	margin: auto;
	text-align: center;
}

#time {
	text-align: center;
	font-size: 120px;
	border: solid 1px black;
	display: inline-block;
	transition: ease-in .4s;
	font-variant-numeric: tabular-nums;
}

#timer-btn-div {
	padding: 5px;
	text-align: center;
}

.hidden {
	visibility: hidden;
}

.visibile {
	visibility: visible;
}

.no-bullets {
	list-style: none;
}

.inline-children > div {
	display: inline-block;
	padding: 0 50;
}

.medium {
	width: 100px;
}

#results {
	padding-top: 5px;
}
`;

const firstPage =	`
<link rel="stylesheet" href="stylesheet.css">
<script src="https://code.jquery.com/jquery-3.2.1.min.js"></script>
<header>
	<h1>VandyApps Code Golf</h1>
</header>
<div class="main">
	<h4>This is the configuration page</h4>
	<div class="sub-div">
		<form action="init" method="post" enctype="multipart/form-data">
			<div id="num-probs" class="form">
				<p>Number of problems:</p>
				<div class="medium">
					<input id="num_probs-input" type="number" name="num_probs" min="1" max="100" required>
				</div>
			</div>
			<div id="answers" class="form">
				<p>Answers:</p>
				<input id="answers-input" type="file" name="answers" multiple required>
			</div>
			<script>
			let num_probs = 0;
			let num_files = 0;
			window.onload = () => {
				document.getElementById('num_probs-input').value ="";

				document.getElementById('answers-input').value="";

				num_probs = 0;
				num_files = 0;
			};

			$('#num_probs-input').change(function() {

				num_probs = ~~this.value;
				numProbsFunc();
			});

			$('#answers-input').change(function() {

				num_files = this.files.length;
				numFilesFunc();
			});

			function numProbsFunc() {
				if (num_files === num_probs) {
					document.getElementById('submit-btn').disabled = '';
					document.getElementById('error-text').style.visibility = 'hidden';
				} else {
					document.getElementById('submit-btn').disabled = 'true';
					document.getElementById('error-text').style.visibility = 'visible';
				}
				let sort_input = document.getElementById('sort-input');
				let j = sort_input.children.length - 1;

				if (num_probs < j && num_probs >= 0) {
					for(let i = j; i > num_probs; --i) {
						sort_input.removeChild(sort_input.children[i]);
					}

				} else {
					let div, p, inpt, i2;
					for(let i = j; i < num_probs; ++i) {
						div = document.createElement('div');
						p = document.createElement('p');
						inpt = document.createElement('input');

						i2 = (i+1).toString()

						div.className = 'inline';
						p.className = 'inline';
						p.innerText = 'Problem ' + i2 + ': ';
						inpt.type = 'checkbox';
						inpt.className = 'sort_probs';

						div.appendChild(p);
						div.appendChild(inpt);

						sort_input.appendChild(div);

					}
				}
				checkChange();
			}

			function numFilesFunc() {
				if (num_files === num_probs) {
						document.getElementById('submit-btn').disabled = '';
						document.getElementById('error-text').style.visibility = 'hidden';
					} else {
						document.getElementById('submit-btn').disabled = 'true';
						document.getElementById('error-text').style.visibility = 'visible';
				}
			}

			function checkChange() {
				let sort_set = new Set();
				$('.sort_probs').each(function(i) {
					$(this).change(() => {
						if(this.checked && !sort_set.has(i))
							sort_set.add(i);
						else if (!this.checked && sort_set.has(i))
							sort_set.delete(i);
						document.getElementById('sort_answers_hidden').value = Array.from(sort_set);
						console.log(sort_set);
					});
				});
				document.getElementById('sort_answers_hidden').value = [];
			}
			</script>
			<div id="sort-input" class="form">
				<p>Does order matter for the problems? i.e. do you want to sort the answers?</p>
			</div>
			<input id="sort_answers_hidden" type="hidden" name="sort_answers" value="">
			<div id="default-score" class="form">
				<p>Default Score:</p>
				<div class="medium">
					<input type="number" name="default_score" min="0" max="100000" value="3000">
				</div>
			</div>
			<div id="duration" class="form">
				<p>Time of Competition:</p>
				<div class="inline small">
					<input type="number" name="hour" min="0" max="24" placeholder="H">
				</div>:
				<div class="inline small">
					<input type="number" name="minute" min="0" max="59" placeholder="M">
				</div>:
				<div class="inline small">
					<input type="number" name="second" min="0" max="59" placeholder="S">
				</div>
			</div>
			<button id="submit-btn" type="submit" disabled='true'>Submit</button>
			<div id="error-text" class="form">
				<p>You must choose 1 answer file per problem for the specified number of problems</p>
			</div>
		</form>
	</div>
</div>
`;

let MODE = 0;


function secondPage(t) {
	return `<link rel="stylesheet" href="stylesheet.css">
<script src="https://code.jquery.com/jquery-3.2.1.min.js"></script>
<header>
	<h1>VandyApps Code Golf</h1>
</header>
<div class="main">
	<div id="timer">
		<h2 id="time">${t}</h2>
		<script>
			window.onload = () => {
				let timeP = document.getElementById('time');
				let timeStr = timeP.innerText;
				let ogTime;
				let time = 0;
				let i = 0;

				while (timeStr.length > 0) {
					time += (~~timeStr.substring(timeStr.lastIndexOf(':') + 1)) * Math.pow(60, i);
					timeStr = timeStr.substring(0, timeStr.lastIndexOf(':'));
					++i;
				}

				ogTime = time;

				let colors = ['red', 'black'];
				let interval;
				let timer_btn = document.getElementById('timer-btn');
				timer_btn.addEventListener('click', () => {
					if (timer_btn.innerText === 'Start') {
						timer_btn.innerText = 'Pause';
						interval = setInterval(() => {
							if (time <= 0) {
								document.getElementById('time').style.color = colors[(colors.indexOf(document.getElementById('time').style.color) + 1) % 2];
								if (time === 0)
									document.getElementById('finished_form').className = 'visible';
								time -= 1;
							} else {
								time -= 1;
								timeP.innerText = convertToStr(time);
							}
						}, 1000)
					} else if (timer_btn.innerText === 'Pause') {
						timer_btn.innerText = 'Start';
						clearInterval(interval);

					}
				});

				let cancel_btn = document.getElementById('cancel-btn');
				cancel_btn.addEventListener('click', () => {
					if (time > 0) time = 0;
					document.getElementById('time').innerText = convertToStr(time);
				});

				let reset_btn = document.getElementById('reset-btn');
				reset_btn.addEventListener('click', () => {
					clearInterval(interval);
					time = ogTime;
					timer_btn.innerText = 'Start';
					document.getElementById('time').innerText = convertToStr(time);
				});
			}

			function convertToStr(s) {
				let seconds = s;
				let h = Math.floor(seconds / 3600);
				seconds -= h * 3600;
				let m = Math.floor(seconds / 60);
				seconds -= m * 60;

				let hStr = h.toString();
				if (hStr.length === 1) hStr = '0' + hStr;
				let mStr = m.toString();
				if (mStr.length === 1) mStr = '0' + mStr;
				let sStr = seconds.toString();
				if (sStr.length === 1) sStr = '0' + sStr;

				return hStr + ':' + mStr + ':' + sStr;
			}
		</script>
		<div id="timer-btns-div" class="inline-children btn-children">
			<div>
				<button id="reset-btn">Reset</button>
			</div>
			<div id="timer-btn-div" class="visible">
				<button id="timer-btn">Start</button>
			</div>
			<div>
				<button id="cancel-btn">Cancel</button>
			</div>
		</div>
	</div>
</div>
<form class="hidden" id="finished_form" action="finished" method="post" enctype="multipart/form-data">
	<label>Submissions list:</label>
	<input type="file" name="urls" requried>
	<button type="submit">Submit</button>
</form>
`;
}

class Contest {
	constructor() {
		this.contestants = [];
	}

	add_all_contestants(contestants) {
		this.contestants.concat(contestants);
	}

	add_contestant(contestant) {
		this.contestants.push(contestant);
	}

	get_top_n_names(n) {
		return this.sortedContestants().slice(0, n);
	}

	sortedContestants() {
		return this.contestants.sort((a, b) => a.get_total_score() - b.get_total_score());
	}

	dump_all_results() {
		let results_id = new Date().toString().replace(/ \(.*\)/, '').replace(/ /g, '_').replace(/:/g,'-');

		// write to file
		//----------------------------------------------------------------------
		// BASH
		// exec_shell(`echo -en "" > ${RESULTS_DIRNAME}/${results_id}.txt`);
		// this.sortedContestants().forEach((contestant, i) => exec_shell(`echo -en "\n${(i + 1).toString()}.\n${contestant.toString()}\n" >> ${RESULTS_DIRNAME}/${results_id}.txt`));
		//----------------------------------------------------------------------
		//----------------------------------------------------------------------
		// JAVASCRIPT
		let data = this.sortedContestants().map((contestant, i) => `\r\n${(i + 1).toString()}.\r\n${contestant.toString()}`).join('\r\n');
		fs.writeFileSync(`${RESULTS_DIRNAME}/${results_id}.txt`, data);
		//----------------------------------------------------------------------
		return results_id;
	}

	dump_all_results_html() {
		let data = this.sortedContestants().map((contestant) => `<li>${contestant.toHtml()}</li>`).join('');
		return `<div id="results">
				<ol>
					${data}
				</ol>
			</div>`
	}

	toString() {
		return `contestants: ${this.contestants}`;
	}
}

class Contestant {
	constructor(name) {
		this.name = name;
		this.scores = DEFAULT_SCORES.slice();
		this.correctness = DEFAULT_CORRECTNESS.slice();
		this.diffs = [];
	}

	add_filesize(problem, score) {
		this.scores[problem - 1] = score;
	}

	add_correct(problem, correct) {
		this.correctness[problem - 1] = correct;
	}

	get_total_score() {
		let total = 0;
		this.scores.forEach((score, i) => total += this.correctness[i] ? score : DEFAULT_SCORES[i]);
		return total;
	}

	// equals(other) {
	// 	return this.name = other.name && this.get_total_score == other.get_total_score;
	// }

	toString() {
		let s = `\n---------${this.name}---------\n`;
		this.scores.forEach((score, i) => s +=
			`\tproblem ${(i+1).toString()}: ${this.correctness[i] ? score : DEFAULT_SCORES[i]}\n`);
		s += `\ttotal: ${this.get_total_score()}\n`
		return s;
	}

	toHtml() {
		let down_arrow = `&#9662;`;
		let up_arrow = `&#9652;`;
		return `
		<p><strong>${this.name}</strong></p>
		<div>
			<p>Problems:</p>
			<ul class="no-bullets">
				${this.scores.map((score, i) => `<li>problem ${(i + 1).toString()}: ${this.correctness[i] ? score : DEFAULT_SCORES[i]}&nbsp;<a style="text-decoration: none; cursor: pointer;" onclick="{
					this.innerHTML = this.innerHTML === '${down_arrow}' ? '${up_arrow}' : '${down_arrow}';
					this.nextElementSibling.hidden = this.nextElementSibling.hidden ? false : true;
				}">${down_arrow}</a>
				<div style="padding-left: 10px;" hidden>
					${this.diffs[i]}
				</div>
				</li>`).join('')}
			</ul>
			<p>total: ${this.get_total_score()}</p>
		</div>`;
	}

}

// execute a function in bash
function exec_shell(str) {
	// returns the stdout
	return execSync(str).toString();

}

function read_file(path) {
	return read_file_js(path);
}

// command line read file function
function read_file_cl(path) {
	return exec_shell(`cat ${path}`);
}

// other read file function
function read_file_js(path) {
	return fs.readFileSync(path, 'utf8');
}

// returns a list of repo names
function build_submission_dir(sub_file_name) {
	if (sub_file_name === undefined) sub_file_name = SUBMISSION_FILENAME
	// read file and put data into sub_str
	let github_list = read_file(sub_file_name).trim().split(/\r\n|\n|\r/);

	// clones the repo and returns the string of the file director cloned into
	github_list = github_list.map(repo => clone_github_repo(repo)).filter(item => item !== null);
	return github_list;
}

// clone a github repo
function clone_github_repo(url) {
	let randInt = Math.floor(Math.random() * 100000).toString();
	let github_dirname = `${extract_username(url)}-${randInt}`;
	try {
		console.log(exec_shell(`git clone ${url} ./github_dirs/${github_dirname}/`));
		return github_dirname;
	} catch (e) {
		console.log(`\n***Not including ${extract_username(url)} in the contest***\n`);
		return null;
	}
}

// get github username from url
function extract_username(url) {
	let splote = url.split('/');
	return splote[splote.indexOf('github.com') + 1];
}

function is_txt(fname) {
	return fname.split('.').pop() === 'txt';
}

function is_file_of_interest(fname) {
	return fname[0] !== '.' && fname.split('.').pop() !== 'git' && fname.split('.').pop() !== 'txt';
}

function is_answer_file_of_interest(fname) {
	return fname[0] !== '.' && fname.split('.').pop() !== 'git';
}

function extract_problem_number(fname) {
	return parseInt(fname.match(/\d+/));
}

// returns file size in number of bytes
function file_size(fname) {
	return fs.statSync(fname).size;
}

function list_equality(l1, l2) {
	if (l1.length !== l2.length)
		return false;

	for (let i = 0; i < l1.length; ++i) {
		if (typeof l1[i] !== typeof l2[i])
			return false;
		if (typeof l1[i] === "object") {
			if (!list_equality(l1[i], l2[i]))
				return false;
		} else {
			if (l1[i] !== l2[i])
				return false;
		}
	}

	return true;
}

function getDiff(a1, a2) {
	let d = listDiff(a1, a2);

	let s = '';
	let check = '<span style="color: green; padding: 0 10px;">&#10004;</span>';
	let ex = '<span style="color: red; padding: 0 10px;">&#10008;</span>';
	d.forEach((v, k) => {
		if (v.length === undefined) {
			// regular value stored here
			s += `<p>line ${k+1}:</p><p>${check}${v[0]}</p><p>${ex}${v[1]}</p>`;
		} else {
			// map stored here
			s += `<p>line ${k+1}:</p><p>${check}${v[0].join(' ')}</p><p>${ex}${v[1].join(' ')}</p>`;
		}
	});

	return s;

}

function listDiff(l1, l2) {
	let diff = new Map();
	let len = Math.min(l1.length, l2.length);

	for (let i = 0; i < len; ++i) {
		if (typeof l1[i] !== typeof l2[i])
			diff.set(i, [l1[i], l2[i]]);
		if (typeof l1[i] === "object") {
			if (!list_equality(l1[i], l2[i]))
				diff.set(i, [l1[i], l2[i]]);
		} else {
			if (l1[i] !== l2[i])
				diff.set(i, [l1[i], l2[i]]);
		}
	}

	return diff;
}

function display(s) {
	try {
		console.log(exec_shell('clear'));
		console.log(s);
	} catch (e) {
		console.log(exec_shell('cls'))
		console.log(s);
	}
}

// =============================================================================
// =============================================================================
async function display_name() {
	return new Promise(resolve => {
		let arr = [YEAR, CODEGOLF, VANDYAPPS];
		let i = setInterval(() => {
			if (arr.length > 0)
				console.log(arr.pop())
			else {
				resolve(clearInterval(i));
			}
		}, 500);
	}).then(() => new Promise(resolve => {
		let t = setTimeout(() => {
			display('');
			resolve(clearTimeout(t));
		}, 1000);
	})).catch(e => console.log(`ERROR DISPLAYING NAME:\n${e}`));
}

function run_gui() {
	console.log('Running GUI\n')

	// delete and remake the github_dirs folder
	try {
		exec_shell('rm -rf github_dirs');
		exec_shell('mkdir github_dirs');
	} catch (e) {

		try {
			exec_shell('del .\\github_dirs\\ -Recurse -Force');
			exec_shell('mkdir github_dirs');
		} catch(e1) {
			console.log('\n\nPLEASE DELETE DIRECTORY: ./github_dirs')
		}
	}

	var contest = new Contest();

	let github_dirnames = [];

	let parsed_solutions = [];

	let diffs = {};

	http.createServer((req, res) => {
		switch (req.url) {
			case '/stylesheet.css':
				res.writeHead(200, {
					"Content-Type": "text/css"
				});
				res.write(stylesheet);
				res.end();
				break;
			case '/init':
				res.writeHead(200, {
					"Content-Type": "text/html"
				});
				res.write('<link rel="stylesheet" href="stylesheet.css">');
				var form = new formidable.IncomingForm();
				form.multiples = true;
				form.parse(req, (err, fields, files) => {

					if (files.answers !== undefined) {
						// console.log(files);
						// console.log(fields);

						let t;

						NUM_PROBLEMS = ~~fields.num_probs;
						DEFAULT_CORRECTNESS = new Array(NUM_PROBLEMS).fill(false);
						DEFAULT_SCORES = new Array(NUM_PROBLEMS).fill(~~fields.default_score);
						SORT_ANSWERS = new Array(NUM_PROBLEMS).fill(false).map((_, i) => fields.sort_answers.split(
							',').includes(i.toString()));

						SOLUTIONS = new Array(NUM_PROBLEMS);

						// allows for 1 or multiple files
						let fs = files.answers.length === undefined ? [files.answers] : files.answers;

						fs.forEach((f) => SOLUTIONS[extract_problem_number(f.name)] = f.path);

						SOLUTIONS.forEach((solution, index) => {
							let question_answers = read_file(solution).trim().split(/\r\n|\n|\r/).map(line => line
								.split(/\s/));

							if (SORT_ANSWERS[index])
								question_answers.sort();

							parsed_solutions.push(question_answers);
						});

						let h = fields.hour !== '' ? fields.hour.toString() : '0';
						let m = fields.minute !== '' ? fields.minute.toString() : '00';
						let s = fields.second != '' ? fields.second.toString() : '00';

						if (h.length === 1) h = '0' + h;
						if (m.length === 1) m = '0' + m;
						if (s.length === 1) s = '0' + s;

						t = `${h}:${m}:${s}`;

						res.write(secondPage(t));
						res.end();
					}
				});
				break;
			case '/finished':
				res.writeHead(200, {
					"Content-Type": "text/html"
				});
				res.write('<link rel="stylesheet" href="stylesheet.css">');
				var form = new formidable.IncomingForm();
				form.multiples = true;
				form.parse(req, (err, fields, files) => {
					if (files.urls !== undefined) {
						// TODO:
						// make this a appear and wait for computation to finish by calling $.get(<something>)
						res.write(`<script src="https://code.jquery.com/jquery-3.2.1.min.js"></script>
						<header>
							<h1>VandyApps Code Golf</h1>
						</header>
						<div id="disappearing-div" style="padding-top:10px; padding-left:10px;">
								<p>Thank you! Cloning repositories now.</p>
								<img src="https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif" width="100" height="100">
						</div>
						`);

						// TODO
						res.write(`<script>
						$.post('clone_repo', {path: ${JSON.stringify(files.urls.path)}}, (r) => {
							console.log(r);
							let d = document.getElementById('disappearing-div');
							d.removeChild(d.firstElementChild);
							d.insertBefore($("<div><p>Scanning through the following repositories</p><ul>"+JSON.parse(r).map((dir) => "<li>" + dir + "</li>").join('')+"</ul></div>").get(0), d.firstElementChild);
							$.get('score', (res) => {
								d.removeChild(d.lastElementChild);

								let scores_div = $("<div>" + res + "</div>").get(0);
								d.appendChild(scores_div);

							});
						});
						</script>`);


						res.end();

						// res.write('<div id="main-div" class="main">');
						//
						// res.write(`
						// <div id="other-disappearing-div">
						// 	<p>Scanning through the following repositories</p>
						// 	<ul>
						// `);
						//
						// github_dirnames.forEach((dir) => res.write(`<li>${dir}</li>`));
						//
						// res.write('</ul></div></div>');







					}
				});
				break;
			case '/results':
				res.writeHead(200, {
					"Content-Type": "text/html"
				});
				res.write('<link rel="stylesheet" href="stylesheet.css">');
				res.write(`<script src="https://code.jquery.com/jquery-3.2.1.min.js"></script>
				<header>
					<h1>VandyApps Code Golf</h1>
				</header>
				`);
				console.log(contest.toString())
				let result_name = contest.dump_all_results();
				console.log(`\n\nResult file: ${result_name}.txt\n\n`);

				try {
					console.log(exec_shell(`cat ./results/${result_name}.txt`));
				} catch(e) {
					console.log(exec_shell(`type .\\results\\${result_name}.txt`))
				}
				res.write(contest.dump_all_results_html());
				res.write(`<script>$.get('test')</script>`)
				res.end();
				break;
			case '/jquery-3.2.1.min.js':
				res.write($);
				break;
			case '/clone_repo':

				let b = [];
				req.on('data', (chunk) => {
					b.push(chunk);
				}).on('end', () => {
					b = Buffer.concat(b).toString();
					res.writeHead(200, {
						'Content-Type': 'text/html'
					});
					github_dirnames = build_submission_dir(decodeURIComponent(b).match(/path=(.*)/)[1]);
					res.end(JSON.stringify(github_dirnames));
				});

				break;
			case '/score':
				res.writeHead(200, {
					'Content-Type': 'text/html'
				});

				res.write(`<div style="padding: 10px; color: red; font-weight: bold;">
				The following contestants did not have the proper directory structure (i.e. ./answers and ./solutions) and therefore will not be evaluated:
				<ul>`)

				for (let contestant of github_dirnames) {
					console.log(`\nEvaluating contestant ${contestant}`);

					let new_contestant_obj = new Contestant(contestant);
					contest.add_contestant(new_contestant_obj);

					// check if solutions and answers directories exist
					let doesExist = fs.readdirSync(`./github_dirs/${contestant}`);
					if (!(doesExist.includes('answers') && doesExist.includes('solutions'))) {
						res.write(`<li>
							${contestant} did not have proper directory structure (/answers and /solutions), so they are not being evaluated.
						</li>`);
						continue;
					}

					let solutions = fs.readdirSync(`./github_dirs/${contestant}/solutions`);

					solutions.forEach(solution => {
						if (is_file_of_interest(solution)) {
							let problem_num = extract_problem_number(solution);

							if (problem_num && problem_num <= parsed_solutions.length) {
								console.log(`Evalutating solution: ${solution}`);

								let source = solution;

								let fsize = file_size(`./github_dirs/${contestant}/solutions/${source}`);
								new_contestant_obj.add_filesize(problem_num, fsize);
							}
						}
					});

					let answers = fs.readdirSync(`./github_dirs/${contestant}/answers`);
					answers.forEach(answer => {
						if (is_answer_file_of_interest(answer)) {
							let problem_num = extract_problem_number(answer);
							if (problem_num && problem_num <= parsed_solutions.length) {
								console.log(`Evaluating answer: ${answer}`);
								let source = answer;
								question_answers = read_file(`./github_dirs/${contestant}/answers/${source}`).trim()
									.split(/\r\n|\n|\r/).map(line => line.split(/\s/));

								if (SORT_ANSWERS[problem_num - 1])
									question_answers.sort();

								new_contestant_obj.add_correct(problem_num, list_equality(question_answers,
									parsed_solutions[problem_num - 1]));

								new_contestant_obj.diffs.push(getDiff(parsed_solutions[problem_num - 1], question_answers));
							}
						}
					});
				}

				res.write('</ul></div>');

				res.write(`<form id="results_form" action="results" method="post" enctype="multipart/form-data">
					<button type="submit">See Results</button>
				</form>`);

				res.end();
				break;
			default:
				// console.log(req);
				// console.log(req.url);
				res.writeHead(200, {
					'Content-Type': 'text/html'
				});
				res.write(firstPage);
				res.end();
				break;
		}

	}).listen(8080);

	try {
		exec_shell('open http://localhost:8080');
	} catch(e) {
		exec_shell('start http://localhost:8080');
	}
}


function run() {
	// Checking command line arguments to see what mode to start
	if (process.argv.length === 3) {
		if (process.argv[2].toLowerCase() === 'cmd') {
			console.log('Command line interface chosen.\n');
			MODE = 1;
		} else if (process.argv[2].toLowerCase() === 'gui') {
			console.log('GUI chosen.\nPlease go to https://localhost:8080\n');
			MODE = 0;
		} else {
			console.log('Unknown argument--defaulting to GUI.\nPlease go to https://localhost:8080\n');
			MODE = 0;
		}
	} else {
		console.log('No command line argument given--defaulting to GUI.\nPlease go to https://localhost:8080\n');
	}

	if (MODE === 0) {
		// GUI
		run_gui();
	} else {
		// COMMAND LINE
		// delete and remake the github_dirs folder
		try {
			exec_shell('rm -rf github_dirs');
			exec_shell('mkdir github_dirs');
		} catch (e) {
			exec_shell('del .\\github_dirs -Recurse -Force');
			exec_shell('mkdir github_dirs');
		}

		// reads from all files in the submissions directory
		let github_dirnames = build_submission_dir();

		let contest = new Contest();

		console.log('Getting answers...');

		let parsed_solutions = [];

		SOLUTIONS.forEach((solution, index) => {
			let question_answers = read_file(solution).trim().split(/\r\n|\n|\r/).map(line => line.split(
				/\s/));

			if (SORT_ANSWERS[index])
				question_answers.sort();

			parsed_solutions.push(question_answers);
		});

		console.log('\nScoring contestants...');

		github_dirnames.forEach((contestant) => {
			console.log(`\nEvaluating contestant ${contestant}`);

			let new_contestant_obj = new Contestant(contestant);
			contest.add_contestant(new_contestant_obj);

			// TODO
			// check if solutions and answers directories exist
			fs.readdirSync(`./github_dirs/${contestant}`);

			//----------------------------------------------------------------------
			// BASH

			//----------------------------------------------------------------------
			//----------------------------------------------------------------------
			// JAVASCRIPT
			let solutions = fs.readdirSync(`./github_dirs/${contestant}/solutions`);
			//----------------------------------------------------------------------

			solutions.forEach(solution => {
				if (is_file_of_interest(solution)) {

					console.log(`Evalutating solution: ${solution}`);

					let problem_num = extract_problem_number(solution);

					let source = solution;

					let fsize = file_size(`./github_dirs/${contestant}/solutions/${source}`);
					new_contestant_obj.add_filesize(problem_num, fsize);
				}
			});

			let answers = fs.readdirSync(`./github_dirs/${contestant}/answers`);
			answers.forEach(answer => {
				if (is_answer_file_of_interest(answer)) {
					let problem_num = extract_problem_number(answer);
					if (problem_num) {
						console.log(`Evaluating answer: ${answer}`);
						let source = answer;
						question_answers = read_file(`./github_dirs/${contestant}/answers/${source}`).trim().split(/\r\n|\n|\r/).map(line => line.split(/\s/));

						if (SORT_ANSWERS[problem_num - 1])
							question_answers.sort();

						new_contestant_obj.add_correct(problem_num, list_equality(question_answers,
							parsed_solutions[problem_num - 1]));
					}
				}
			});
		});

		let result_name = contest.dump_all_results();
		console.log(`\n\nResult file: ${result_name}.txt\n\n`);

		try {
			console.log(exec_shell(`cat ./results/${result_name}.txt`));
		} catch(e) {
			console.log(exec_shell(`type .\\results\\${result_name}.txt`))
		}

	}
}

display_name().then(() => run()).catch(e => console.log(`ERROR - QUITTING PROGRAM\n${e}`));
