import { createParamDecorator } from "../utils/paramDecorator";

export const Body = () => createParamDecorator('body');
export const Query = (key?: string) => createParamDecorator('query', key);
export const Params = (key?: string) => createParamDecorator('params', key);
export const Headers = (key?: string) => createParamDecorator('headers', key);
export const Cookie = (key?: string) => createParamDecorator('cookie', key);
export const Set = () => createParamDecorator('set');
export const Context = () => createParamDecorator('context');
