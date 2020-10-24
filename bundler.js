/**
 * "This is not a framework" | Default bundler.
 * See: https://github.com/matteocargnelutti/this-is-not-a-framework
 * 2020 Matteo Cargnelutti (@matteocargnelutti)
 * 
 * Notes:
 * ------
 * - Ultra basic, zero-dependency, JavaScript and CSS bundler for "This is not a framework".
 * - Simply run it with NodeJS to generate bundle files.
 * - Edit file-level constants to customize input and output paths.
 * 
 * Important:
 * ----------
 * - This bundler is mostly here to hold the promise of a zero dependencies boilerplate.
 * - You are VERY MUCH encouraged to use a more advanced bundler. 
 * - Will only work on UNIX-like systems.
 * - No minification is provided.
 */

//------------------------------------------------------------------------------
// Imports
//------------------------------------------------------------------------------
const { execSync } = require("child_process");
const fs = require('fs');

//------------------------------------------------------------------------------
// File-level constants
//------------------------------------------------------------------------------
const INPUT_JS_PATH = './src';
const INPUT_CSS_PATH = './src';
const OUTPUT_JS_PATH = './dist/bundle.js';
const OUTPUT_CSS_PATH = './dist/bundle.css';

//------------------------------------------------------------------------------
// Bundler function
//------------------------------------------------------------------------------
/**
 * Search for files of a given type and concatenates them into one.
 * 
 * @param {String} fileExt Must be either 'js' or 'css'. Will default to JS.
 * @param {String} inputPath Path from where files of extension .fileExt must be searched.
 * @param {String} outputPath Destination of the bundled file.
 * @returns {Boolean}
 */
function bundler(fileExt, inputPath, outputPath) {
  let output = '';

  // Enforce either 'js' or 'css' as a file extenstion
  fileExt = ['js', 'css'].includes(fileExt) ? fileExt : 'js';

  // Grab list of files from UNIX's `find`
  let files = execSync(`find ${inputPath} -type f -name "*.${fileExt}"`).toString();

  // Iterate over list of files and:
  // - Ignore empty strings
  // - Try reading and appending current file to output
  for( let file of files.split('\n') ) {

    if( !file ) {
      continue;
    }

    try {
      console.log(`Bundling ${file} ...`);
      output += fs.readFileSync(file, 'utf8') + '\n';
    }
    catch(err) {
      console.error(`${file} could not be read.`);
    }

  }

  // Save output to bundle file
  console.log(`Saving bundle under ${outputPath}`)
  fs.writeFileSync(outputPath, output);
}

//------------------------------------------------------------------------------
// Execute bundler
//------------------------------------------------------------------------------
bundler('js', INPUT_JS_PATH, OUTPUT_JS_PATH);
bundler('css', INPUT_CSS_PATH, OUTPUT_CSS_PATH);
