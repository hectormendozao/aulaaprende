#!/usr/bin/env node

console.log("PostInstall");
console.log(process.env);
console.log(global);
console.log(global.argv[0]);
console.log(process.env.npm_package_name);