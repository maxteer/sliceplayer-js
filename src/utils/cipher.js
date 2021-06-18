import { loadURL } from './';

const JS_FUNCTION_REGEX = /\w+\.(\w+)\(\w,(\d+)\)/;
const INITIAL_FUNCTION_REGEXS = [
  /yt\.akamaized\.net\/\)\s*\|\|\s*.*?\s*[cs]\s*&&\s*[adf]\.set\([^,]+\s*,\s*(?:encodeURIComponent\s*\()?\s*()$/,
  /(?:\b|[^a-zA-Z0-9$])([a-zA-Z0-9$]{2})\s*=\s*function\(\s*a\s*\)\s*\{\s*a\s*=\s*a\.split\(\s*""\s*\)/,
  /\b[a-zA-Z0-9]+\s*&&\s*[a-zA-Z0-9]+\.set\([^,]+\s*,\s*encodeURIComponent\s*\(\s*([a-zA-Z0-9$]+)\(/,
  /\b[cs]\s*&&\s*[adf]\.set\([^,]+\s*,\s*encodeURIComponent\s*\(\s*([a-zA-Z0-9$]+)\(/,
  /([a-zA-Z0-9$]+)\s*=\s*function\(\s*a\s*\)\s*\{\s*a\s*=\s*a\.split\(\s*""\s*\)/,
  /\bc\s*&&\s*[a-zA-Z0-9]+\.set\([^,]+\s*,\s*\([^)]*\)\s*\(\s*([a-zA-Z0-9$]+)\(/,
  /\b[a-zA-Z0-9]+\s*&&\s*[a-zA-Z0-9]+\.set\([^,]+\s*,\s*([a-zA-Z0-9$]+)\(/,
  /\bc\s*&&\s*a\.set\([^,]+\s*,\s*\([^)]*\)\s*\(\s*([a-zA-Z0-9$]+)\(/,
  /\b[cs]\s*&&\s*[adf]\.set\([^,]+\s*,\s*([a-zA-Z0-9$]+)\(/,
  /(["'])signature\1\s*,\s*([a-zA-Z0-9$]+)\(\(/,
  /\.sig\|\|([a-zA-Z0-9$]+)\(/g,
];

const cipherCache = {};
const functions = {
  '\\{\\w\\.reverse\\(\\)\\}': (array, _) => {
    return array.reverse();
  },
  '\\{\\w\\.splice\\(0,\\w\\)\\}': (array, argument) => {
    array.splice(0, Number(argument));
    return array;
  },
  '\\{var\\s\\w=\\w\\[0];\\w\\[0]=\\w\\[\\w%\\w.length];\\w\\[\\w]=\\w\\}': (
    array,
    argument,
  ) => {
    const position = Number(argument);
    const char = array[0];
    array[0] = array[position % array.length];
    array[position] = char;
    return array;
  },
  '\\{var\\s\\w=\\w\\[0];\\w\\[0]=\\w\\[\\w%\\w.length];\\w\\[\\w%\\w.length]=\\w\\}':
    (array, argument) => {
      const position = Number(argument);
      const char = array[0];
      array[0] = array[position % array.length];
      array[position % array.length] = char;
      return array;
    },
};

export async function createCipher(jsURL) {
  let cipher = cipherCache[jsURL];
  if (!cipher) {
    const js = await loadURL(jsURL);

    const transformFunctions = getTransformFunctions(js);
    const transformFunctionsMap = getTransformFunctionsMap(
      transformFunctions[0].getVar(),
      js,
    );

    cipher = {
      transformFunctions,
      transformFunctionsMap,
      getSignature: cipheredSignature => {
        let signature = [...cipheredSignature];
        for (const fun of transformFunctions) {
          signature = transformFunctionsMap[fun.getName()](
            signature,
            fun.getArgument(),
          );
        }
        return signature.join('');
      },
    };
    cipherCache[jsURL] = cipher;
  }

  return cipher;
}

const getInitialFunctionName = js => {
  for (const regex of INITIAL_FUNCTION_REGEXS) {
    const matcher = js.match(regex);
    if (matcher) return matcher[1];
  }

  throw new Error('Initial function name not found');
};

const getTransformFunctions = js => {
  const name = getInitialFunctionName(js).replace(/[^$A-Za-z0-9_]/, '');
  const regex = new RegExp(
    quote(name) + /\=function\(\w\)\{[a-z=\.\("\)]*;(.*);(?:.+)\}/.source,
  );
  const matcher = js.match(regex);
  if (matcher) {
    const split = matcher[1].split(';');
    const functions = [];
    for (const fun of split) {
      const funVar = fun.split(/\./)[0];
      const parsedFun = parseFunction(fun);

      functions.push({
        getVar: () => funVar,
        getName: () => parsedFun[0],
        getArgument: () => parsedFun[1],
      });
    }

    return functions;
  }

  throw new Error('Transformation functions not found');
};

const getTransformFunctionsMap = (funVar, js) => {
  const transformObject = getTransformObject(funVar, js);
  const mapper = {};
  for (const object of transformObject) {
    const split = object.split(':', 2);
    mapper[split[0]] = mapFunction(split[1]);
  }

  return mapper;
};

const getTransformObject = (funVar, js) => {
  funVar = funVar.replace(/[^$A-Za-z0-9_]/g, '');
  const regex = new RegExp(`var ${funVar}=\{(.*?)\};`, 's');
  const matcher = js.match(regex);
  if (matcher) {
    return matcher[1].replace(/\n/g, ' ').split(', ');
  }

  throw new Error('Transform object not found');
};

const mapFunction = fun => {
  for (const [key, value] of Object.entries(functions)) {
    if (fun.match(new RegExp(key))) return value;
  }

  throw new Error('Map function not found');
};

const parseFunction = fun => {
  const matcher = fun.match(JS_FUNCTION_REGEX);
  if (matcher) {
    return [matcher[1], matcher[2]];
  }

  throw new Error('Could not parse js function');
};

function quote(quote) {
  return quote.replace(/([\[\]\^\$\|\(\)\\\+\*\?\{\}\=\!])/gi, '\\$1');
}
