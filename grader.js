const http = require('http')
const { execSync } = require('child_process');
const formidable = require('formidable');
const fs = require('fs');

const RESULTS_DIRNAME = './results';
const SUBMISSION_FILENAME = 'submissions.txt';
const NUM_PROBLEMS = 6;
const SOLUTIONS = new Array(NUM_PROBLEMS).fill('').map((_, i) => `./answers/${(i + 1).toString()}.txt`);
const SORT_ANSWERS = new Array(NUM_PROBLEMS).fill(false);
const DEFAULT_SCORES = new Array(NUM_PROBLEMS).fill(3000);
const DEFAULT_CORRECTNESS = new Array(NUM_PROBLEMS).fill(false);
const VANDYAPPS = " __      __             _                                \n \\ \\    / /            | |         /\\                    \n  \\ \\  / /_ _ _ __   __| |_   _   /  \\   _ __  _ __  ___ \n   \\ \\/ / _` | '_ \\ / _` | | | | / /\\ \\ | '_ \\| '_ \\/ __|\n    \\  / (_| | | | | (_| | |_| |/ ____ \\| |_) | |_) \\__ \\ \n     \\/ \\__,_|_| |_|\\__,_|\\__, /_/    \\_\\ .__/| .__/|___/\n                           __/ |        | |   | |        \n                          |___/         |_|   |_|        \n";
const CODEGOLF = "   _____          _         _____       _  __ \n  / ____|        | |       / ____|     | |/ _|\n | |     ___   __| | ___  | |  __  ___ | | |_ \n | |    / _ \\ / _` |/ _ \\ | | |_ |/ _ \\| |  _|\n | |___| (_) | (_| |  __/ | |__| | (_) | | |  \n  \\_____\\___/ \\__,_|\\___|  \\_____|\\___/|_|_|  \n                                              \n";
const YEAR = "  ___   ___  __ ______ \n |__ \\ / _ \\/_ |____  |\n    ) | | | || |   / / \n   / /| | | || |  / /  \n  / /_| |_| || | / /   \n |____|\\___/ |_|/_/    \n                       \n\n\n";

let MODE = 0;




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
		let results_id = new Date().toString().replace(/ \(.*\)/, '').replace(/ /g, '_').replace(/:/g, '-');
		
		// write to file
		//----------------------------------------------------------------------
		// BASH
		// exec_shell(`echo -en "" > ${RESULTS_DIRNAME}/${results_id}.txt`);
		// this.sortedContestants().forEach((contestant, i) => exec_shell(`echo -en "\n${(i + 1).toString()}.\n${contestant.toString()}\n" >> ${RESULTS_DIRNAME}/${results_id}.txt`));
		//----------------------------------------------------------------------
		//----------------------------------------------------------------------
		// JAVASCRIPT
		let data = this.sortedContestants().map((contestant, i) => `\n${(i + 1).toString()}.\n${contestant.toString()}`).join('\n');
		fs.writeFileSync(`${RESULTS_DIRNAME}/${results_id}.txt`, data);
		//----------------------------------------------------------------------
		return results_id;
	}
}

class Contestant {
	constructor(name) {
		this.name = name;
		this.scores = DEFAULT_SCORES.slice();
		this.correctness = DEFAULT_CORRECTNESS.slice();
	}

	add_filesize(problem, score) {
		this.scores[problem-1] = score;
	}

	add_correct(problem, correct) {
		this.correctness[problem-1] = correct;
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
		this.scores.forEach((score, i) => s += `\tproblem ${(i+1).toString()}: ${this.correctness[i] ? score : DEFAULT_SCORES[i]}\n`);
		s += `\ttotal: ${this.get_total_score()}\n`
		return s;
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
	let randInt = Math.floor(Math.random() * 10000).toString();
	let github_dirname = `${extract_username(url)}-${randInt}`;
	try {
		console.log(exec_shell(`git clone ${url} ./github_dirs/${github_dirname}/`));
		return github_dirname;
	} catch (e) {
		console.log(`Not including ${extract_username(url)} in the contest\n`);
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

function display(s) {
	console.log(exec_shell('clear'));
	console.log(s);
}

// =============================================================================
// =============================================================================
async function display_name() {
	return new Promise(resolve => {
		let arr = [YEAR, CODEGOLF, VANDYAPPS];
		let i = setInterval(() => {
			if(arr.length > 0)
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
	}));
}


function run() {
	console.log('\nStarting grader\n');

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

		// delete and remake the github_dirs folder
		exec_shell('rm -rf github_dirs');
		exec_shell('mkdir github_dirs');

		let contest = new Contest();

		let github_dirnames;

		let parsed_solutions = [];

		http.createServer((req, res) => {
			if (req.url == '/submitUrls') {
				exec_shell('rm -rf submissions/*');
				var form = new formidable.IncomingForm();
				form.parse(req, (err, fields, files) => {
					if (files.urls !== undefined) {
						var oldPath = files.urls.path;
						var newPath = __dirname + '/' + files.urls.name;
						fs.rename(oldPath, newPath, (err) => {
							if (err)
								throw err;
						});

						github_dirnames = build_submission_dir(files.urls.name);

						res.write('<p>Thank you! Cloning repositories now</p>');
						res.write('<img class="irc_mi" src="https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif">');
						res.end();
					}
				});


			} else {
				console.log('Getting answers');

				res.writeHead(200, { 'Content-Type': 'text/html' });
				res.write('<h1>Code Golf 2018</h1>');
				res.write('<p>Please submit a text file of the submission links below</p>');
				res.write('<form action="submitUrls" method="post" enctype="multipart/form-data">');
				res.write('<input type="file" name="urls"><br>');
				res.write('<input type="submit">');
				res.write('</form>');
				return res.end();
			}
		}).listen(8080);
	} else {
		// COMMAND LINE
		// delete and remake the github_dirs folder
		exec_shell('rm -rf github_dirs');
		exec_shell('mkdir github_dirs');

		// reads from all files in the submissions directory
		let github_dirnames = build_submission_dir();

		let contest = new Contest();

		console.log('Getting answers...');

		let parsed_solutions = [];

		SOLUTIONS.forEach((solution, index) => {
			let question_answers = read_file(solution).trim().split(/\r\n|\n|\r/).map(line => line.split(/\s/));

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

						new_contestant_obj.add_correct(problem_num, list_equality(question_answers, parsed_solutions[problem_num - 1]));
					}
				}
			});
		});

		let result_name = contest.dump_all_results();
		console.log(`\n\nResult file: ${result_name}.txt\n\n`);
		console.log(exec_shell(`cat ./results/${result_name}.txt`));


	}
}

display_name().then(() => run());