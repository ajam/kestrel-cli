var helpers = {
	createRemoteUrl: function(login_method, account, repo){
		if (login_method == 'ssh'){
			return 'git@github.com:' + account + '/' + repo + '.git'
		}else if (login_method == 'https'){
			return 'https://github.com/' + account + '/' + repo + '.git';
		}
	}
}
var sh_commands = {
	init: function(login_method, account, repo){
		return 'git init && git remote add origin ' + helpers.createRemoteUrl(login_method, account, repo);
	},
	archive: function(login_method, account, repo, branches){
		return 'git push ' + helpers.createRemoteUrl(login_method, account, repo) + ' ' + branches;
	},
	status: function(){
		return 'git status -sb';
	},
	statusPorcelain: function(){
		return 'git status --porcelain';
	},
	revertToPreviousCommit: function(){
		return 'git reset --soft \'HEAD^\'';
	},
	deployLastCommit: function(trigger_commit_msg){
		return 'git commit -m "' + trigger_commit_msg + '" --allow-empty && git push origin master'
	}
	//,scrubLastCommit: function(scrubbed_commit_msg){
	// 	return 'git commit --amend -m "' + scrubbed_commit_msg + '" --allow-empty && git push origin master -f'
	// }
}

module.exports = sh_commands;