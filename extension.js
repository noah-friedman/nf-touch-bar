const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	const gitAPI = vscode.extensions.getExtension("vscode.git").exports.getAPI(1);

	let pushPull = new vscode.Disposable();
	const watchGit = () => {
		if (gitAPI.repositories.length > 0) {
			const repoState = gitAPI.repositories[0].state;
			console.log(repoState)

			const watchPushPull = () => {
				vscode.commands.executeCommand("setContext", "nf-touch-bar.showPush", repoState.HEAD.ahead > 0);
				vscode.commands.executeCommand("setContext", "nf-touch-bar.showPull", repoState.HEAD.behind < 0);
			}
			watchPushPull()

			pushPull = repoState.onDidChange(watchPushPull)
			context.subscriptions.push(pushPull)
		} else {
			pushPull.dispose();
			vscode.commands.executeCommand("setContext", "nf-touch-bar.showPush", false);
			vscode.commands.executeCommand("setContext", "nf-touch-bar.showPull", false);
		}
	}
	watchGit()

	context.subscriptions.push(gitAPI.onDidOpenRepository(watchGit));
	context.subscriptions.push(gitAPI.onDidCloseRepository(watchGit));

	const config = vscode.workspace.getConfiguration("nf-touch-bar.commands")

	const commandIDs = Object.entries({
		"run": ["start", "debug"],
		"test": ["start", "debug", "restart", "stop"],
		"terminal": ["togglePanel"],
		"git": ["togglePanel", "push", "forcePush", "pull"],
		"folder": ["open", "openRecent", "close"]
	})
	let commands = {}
	commandIDs.forEach(([category]) => commands[category] = {})
	
	commandIDs.forEach(([category, command]) => command.forEach(command => {
		commands[category][command] = vscode.commands.registerCommand(`nf-touch-bar.${category}.${command}`, () => vscode.commands.executeCommand(config.get(`${category}.${command}`)));
		context.subscriptions.push(commands[category][command])
	}));

	vscode.workspace.onDidChangeConfiguration(e => {
		commandIDs.forEach(([category, command]) => command.forEach(command => {
			if (e.affectsConfiguration(`nf-touch-bar.commands.${category}.${command}`)) {
				commands[category][command].dispose()
				commands[category][command] = vscode.commands.registerCommand(`nf-touch-bar.${category}.${command}`, () => vscode.commands.executeCommand(config.get(`${category}.${command}`)));
				context.subscriptions.push(commands[category][command])
			}
		}))
	})
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
}
