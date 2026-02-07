import { Parser } from '../types';
import { NpmParser } from './npm';
import { PythonParser } from './python';
import { JavaParser } from './java';
import { GoParser } from './go';
import { RustParser } from './rust';

export const parsers: Parser[] = [
  new NpmParser(),
  new PythonParser(),
  new JavaParser(),
  new GoParser(),
  new RustParser(),
];

export function getParserForFile(fileName: string): Parser | undefined {
  return parsers.find(parser => 
    parser.filePatterns.some(pattern => fileName.endsWith(pattern))
  );
}

export { NpmParser, PythonParser, JavaParser, GoParser, RustParser };
