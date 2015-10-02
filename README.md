# Problem Description
Your company has been using a 3rd-party service `PersistentConn` for sending push notifications to your web app. The app uses a pay-per-connection model. Logs show that the number of connections to `PersistentConn` is consistently reaching the limit, which is much higher than the separately reported maximum number of concurrent users. After some investigation it appears some users have many, many tabs of the site open at once and each tab is creating a connection.

Your goal is to prevent having to upgrade the plan by wrapping the `PersistentConn` interface with one that automatically handles opening a single connection and sharing access to it across all tabs with the site open in the same browser window. Luckily there is already a library in use to enable communication between browser tabs (located at `src/browser_ipc.js`).

The only change existing code should need to make is to replace the `PersistentConn` constructor with `PersistentConnProxy`. The rest of the code shouldn't require any changes or be aware it doesn't have a "real" `PersistentConn` and should be able to interact with the `PersistentConnProxy` object as if it were `PersistentConn`. 

Please implement the `PersistentConnProxy` class. 

# Resources
The `src` directory contains the existing Javascript libraries available for use. The BrowserIpc library is functional and should not require any modifications (if you find any errors in it please report them, but it is unexpected). The included PersistentConn library is an incredibly basic mock. Feel free to modify/replace it with something more useful for your testing. When deployed your library will have a "real" but unmodifiable PersistentConn object available.

The `docs` directory contains documentation for the BrowserIpc library and a complete description of the `PersistentConn` API which must be implemented.

The `examples` directory has a small example of using the BrowserIpc library (must be served from a webserver for the tabs to communicate, but `localhost` is fine.). Again this library is assumed to be complete, the example is to help understand how to use it.

# Instructions
1. Implement a `PersistentConnProxy` class.
2. Feel free to (and please do!) include any extra files you used in your development process.
3. When you are done bundle your files (`.zip`, `.tar.gz`, etc.) and include it in an email to <mailto:hiring@runrun.it>.

# Considerations
- The final solution must be in Javascript that can run in most modern browsers, however if you prefer to program in a language which compiles to Javascript (Coffeescript, ECMAScript 6, etc.) that is fine as long as you include those files and a precompiled JS solution.
- You can use any type of Javascript "class" and dependency managemnt. The `browser_ipc.js` uses UMD so it should be compatible with your favorite method (and it is not necessary to copy its style).
- In addition to the solution any tests or other code you used to help you develop your solution should be included.

# Evaluation
Some of our existing developers will be given your solution to review. Correctness is important, but the ease with which correctness can be verified (readability, test coverage, etc) will be important as well. Performance will only be considered to ensure there are no obvious memory leaks which could cause issues on long running tabs.


# Solution

The solution for the problem is inside the solutions directory. Read solution/solution.md for an overview of the solution