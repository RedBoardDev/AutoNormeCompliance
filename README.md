
<h1 align="center">Auto norme compliance Extension</h1>

<p>This is a Visual Studio Code extension that checks the Epitech coding style of C files using the <a href="https://github.com/Epitech/coding-style-checker">Epitech Coding Style Checker</a>.
</br>
The extension runs the checker in a Docker container and displays the results as diagnostics in the editor.</p>

<h2>Requirements</h2>
<ul>
    <li>Visual Studio Code</li>
    <li>Docker</li>
</ul>
<h2>Installation</h2>
<p>You can install the extension from the <a href="https://marketplace.visualstudio.com/items?itemName=redboarddev.autonormecompliance">Visual Studio Code Marketplace</a> or by searching for "AutoNormeCompliance" in the extension manager.</p>

<div>
    <h2>How to use the extension</h2>
    <h4>Click on the 'Coding Style' button or use the command palette:</h4>
    <ol>
        <li>Open your project folder in Visual Studio Code.</li>
        <li>Press "Ctrl+Shift+P" or "Cmd+Shift+P" to open the command palette.</li>
        <li>Type "Check Coding Style" and select the command from the dropdown list.</li>
        <li>The extension will run the Docker script and display any coding style errors by warning in the editor.</li>
    </ol>
</div>

<h2>To Do List</h2>

- [X] warning diagnostic when coding error found
- [X] check for more file than .c extension
- [X] do not check file into .gitignore file
- [ ] Use epitech coding style script without docker
- [ ] fix basic error automatically
- [ ] automatically check every X times

<h2>License</h2>
<p>This extension is licensed under the MIT License.</p>
