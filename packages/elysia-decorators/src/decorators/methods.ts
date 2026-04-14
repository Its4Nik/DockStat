import { createMethodDecorator } from "../utils/methodDecorator";

export const Get = createMethodDecorator('get');
export const Post = createMethodDecorator('post');
export const Put = createMethodDecorator('put');
export const Patch = createMethodDecorator('patch');
export const Delete = createMethodDecorator('delete');
export const Options = createMethodDecorator('options');
