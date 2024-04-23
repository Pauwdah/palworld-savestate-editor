1. Get Steam Accounts on Machine into 2D Array with [[solveLevelMeta(pathArray)]] `['<accountname>', '<steamID64 (Dec)>']`
2. Let User Select what account they wanna use. `userselect -> accountname` 
3. Add `<steamID64 (Dec)>` to the Client Default Path with [[createClientPath()]]
4. Validate Default Paths for Save states with [[getPathsOfFileInFirstLevelDirs(directoryPath, fileName)]]
	1. Client `%localappdata%/Pal/Saved/SaveGames/<steamID64 (Dec)>`
	2. Server `C:\\Program Files (x86)\\Steam\\steamapps\\common\\PalServer\\Pal\\Saved\\SaveGames\\0`
5. If Default Path not found let user pick path. 
6. 



