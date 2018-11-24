const http = require('http')
const { spawnSync } = require('child_process');
const formidable = require('formidable');
const fs = require('fs');

const RESULTS_DIRNAME = './results';
const SUBMISSION_DIRNAME = './submissions';
const NUM_PROBLEMS = 6;
const SOLUTIONS = new Array(NUM_PROBLEMS).map((_, i) => `./answers/${(i + 1).toString()}.txt`);
const SORT_ANSWERS = new Array(NUM_PROBLEMS).fill(false);
const DEFAULT_SCORES = new Array(NUM_PROBLEMS).fill(3000);
const DEFAULT_CORRECTNESS = new Array(NUM_PROBLEMS).fill(false);
let MODE = 0;

;

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
		let results_id = new Date().toString().replace(/ \(.*\)/, '').replace(/ /g, '_');
		
		// write to file
		//----------------------------------------------------------------------
		// BASH
		// exec_shell(`echo -en "" > ${RESULTS_DIRNAME}/${results_id}.txt`);
		// this.sortedContestants().forEach((contestant, i) => exec_shell(`echo -en "\n${(i + 1).toString()}.\n${contestant.toString()}\n" >> ${RESULTS_DIRNAME}/${results_id}.txt`));
		//----------------------------------------------------------------------
		//----------------------------------------------------------------------
		// JAVASCRIPT
		let data = this.sortedContestants().map((contestant, i) => `\n${(i + 1).toString()}.\n${contestant.toString()}`).join('\n');
		fs.writeFile(`${RESULTS_DIRNAME}/${results_id}.txt`, data, (err) => console.log(err));
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
		let s = `\n---------${this.name}---------`;
		this.scores.forEach((score, i) => s += `\tproblem ${(i+1).toString()}: ${this.correctness[i] ? score : DEFAULT_SCORES[i]}\n`);
		s += `\ttotal: ${this.get_total_score()}\n`
		return s;
	}

}

console.log(exec_shell('ls'));


// execute a function in bash
function exec_shell(str) {
	// returns the stdout
	let {stdout, stderr} = spawnSync(str);
	return {stdout: stdout.toString(), stderr: stderr.toString()};
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
	if (sub_file_name === undefined) sub_file_name = fs.readdirSync(SUBMISSION_DIRNAME)[0];
	
	// read file and put data into sub_str
	let github_list = read_file(SUBMISSION_DIRNAME + '/' + sub_file_name).trim().split('/n');

	// REMOVE
	console.log(github_list);

	// clones the repo and returns the string of the file director cloned into
	github_list.map(repo => clone_github_repo(repo));
	return github_list;
}

// clone a github repo
function clone_github_repo(url) {
	console.log('cloning: ' + url);
	let randInt = Math.floor(Math.random() * 10000).toString();
	let github_dirname = `${extract_username(url)}-${randInt}`;
	exec_shell(`git clone ${url} ./github_dirs/${github_dirname}/`);
	return github_dirname;
}

// get github username from url
function extract_username(url) {
	let splote = url.split('/');
	return splote[splote.indexOf('github.com') + 1];
}

function is_txt(fname) {
	return fname.split('.')[-1] === 'txt';
}

function is_file_of_interest(fname) {
	return fname[0] !== '.' && fname.split('.')[-1] !== 'git' && fname.split('.')[-1] !== 'txt';
}

function is_answer_file_of_interest(fname) {
	return fname[0] !== '.' && fname.split('.')[-1] !== 'git';
}

function extract_problem_number(fname) {
	return ~~fname;
}

// returns file size in number of bytes
function file_size(fname) {
	return fs.statSync(fname).size;
}

function display(s) {
	exec_shell('clear');
	console.log(s);
}

// =============================================================================
// =============================================================================

console.log('Starting grader\n');

// Checking command line arguments to see what mode to start
if (process.argv.length === 3) {
	if (process.argv[2].toLowerCase() === 'cmd') {
		console.log('Command line interface chosen.');
		MODE = 1;
	} else if (process.argv[2].toLowerCase() === 'gui') {
		console.log('GUI chosen.\nPlease go to https://localhost:8080');
		MODE = 0;
	} else {
		console.log('Unknown argument--defaulting to GUI.\nPlease go to https://localhost:8080');
		MODE = 0;
	}
} else {
	console.log('No command line argument given--defaulting to GUI.\nPlease go to https://localhost:8080');
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
					var newPath = __dirname + '/' + SUBMISSION_DIRNAME + '/' + files.urls.name;
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

			res.writeHead(200, {'Content-Type': 'text/html'});
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
		question_answers = read_file(solution).trim().split('\n').map(line => line.split(' '));

		if (SORT_ANSWERS[index])
			question_answers.sort();

		parsed_solutions.push(question_answers);
	});

	console.log('\nScoring contestants...\n');

	console.log(fs.readdirSync(`.`));

	github_dirnames.forEach((contestant) => {
		console.log(`Evaluating contestant ${contestant}`);

		let new_contestant_obj = new Contestant(contestant);
		contest.add_contestant(new_contestant_obj);

		fs.readdirSync(`./github_dirs/${contestant}`);

		//----------------------------------------------------------------------
		// BASH
		
		//----------------------------------------------------------------------
		//----------------------------------------------------------------------
		// JAVASCRIPT
		let solutions =	fs.readdirSync(`./github_dirs/${contestant}/solutions`);
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

		let answers = fs.readdirSync(`./github_dirs/${contestant}/answers`, { encoding: 'utf8', withFileTypes: true });
	});

	

}