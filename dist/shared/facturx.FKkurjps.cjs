'use strict';

const name = "@lezram/facturx";
const version = "0.2.0";
const description = "Factur-X and Order-X generation library for European e-invoicing standard";
const repository = "stafyniaksacha/facturx";
const keywords = [
	"factur-x",
	"order-x",
	"e-invoicing",
	"pdf",
	"xml",
	"european",
	"en16931"
];
const license = "MIT";
const type = "module";
const exports$1 = {
	".": {
		types: "./dist/index.d.ts",
		"import": "./dist/index.mjs",
		require: "./dist/index.cjs"
	},
	"./cli": {
		types: "./dist/cli.d.ts",
		"import": "./dist/cli.mjs",
		require: "./dist/cli.cjs"
	}
};
const main = "./dist/index.mjs";
const types = "./dist/index.d.ts";
const files = [
	"dist",
	"schema",
	"bin"
];
const bin = {
	facturx: "./bin/facturx.mjs"
};
const scripts = {
	prepack: "unbuild",
	dev: "unbuild --watch",
	build: "unbuild",
	test: "vitest"
};
const dependencies = {
	citty: "^0.1.6",
	"date-fns": "^3.6.0",
	libxmljs2: "github:lezram/libxmljs2",
	"pdf-lib": "^1.17.1"
};
const devDependencies = {
	"@types/node": "^20.11.27",
	typescript: "^5.5.4",
	unbuild: "3.0.0-rc.7",
	vitest: "^2.0.5"
};
const pkg = {
	name: name,
	version: version,
	description: description,
	repository: repository,
	keywords: keywords,
	license: license,
	type: type,
	exports: exports$1,
	main: main,
	types: types,
	files: files,
	bin: bin,
	scripts: scripts,
	dependencies: dependencies,
	devDependencies: devDependencies
};

exports.description = description;
exports.name = name;
exports.pkg = pkg;
exports.version = version;
