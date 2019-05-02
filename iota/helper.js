/**
 * Function for generating wallet index
 */


function generateIndex() {
    const min = 0;
    const max = 100;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Function for parsing args
 */
function getArgs() {
    const args = {}
    process.argv
        .slice(2, process.argv.length)
        .forEach(arg => {
            // long arg
            if (arg.slice(0, 2) === '--') {
                const longArg = arg.split('=')
                args[longArg[0].slice(2, longArg[0].length)] = longArg[1]
            }
            // flags
            else if (arg[0] === '-') {
                const flags = arg.slice(1, arg.length).split('')
                flags.forEach(flag => {
                    args[flag] = true
                })
            }
        })
    return args
}


module.exports = { generateIndex,getArgs };