// LICENSE : MIT
"use strict";
const assert = require("assert");
import Dispatcher from "./Dispatcher";
import UseCaseContext from "./UseCaseContext";
import {ActionTypes} from "./Context";
export default class UseCase extends Dispatcher {
    static isUseCase(v) {
        if (v instanceof UseCase) {
            return true;
        } else if (typeof v === "object" && typeof v.execute === "function") {
            return true;
        }
        return false
    }

    constructor() {
        super();
        /**
         * @type {string} default: UseCase name
         */
        this.name = this.displayName || this.constructor.name;
        /**
         * @type {string} UseCase name
         */
        this.useCaseName = this.constructor.name;

    }

    execute() {
        throw new TypeError(`should be overwrite ${this.constructor.name}#execute()`);
    }

    /**
     * get context of UseCase
     * @returns {UseCaseContext}
     */
    get context() {
        return new UseCaseContext(this);
    }

    /**
     * called the {@link errorHandler} with error when error is occurred.
     * @param {function(error: Error)} errorHandler
     * @returns {function(this:Dispatcher)}
     */
    onError(errorHandler) {
        return this.onDispatch(payload => {
            if (payload.type === ActionTypes.ON_ERROR) {
                errorHandler(payload.error);
            }
        });
    }

    /**
     * throw error event
     * you can use it instead of `throw new Error()`
     * this error event is caught by dispatcher.
     * @param {Error} error
     */
    throwError(error) {
        const payload = {
            type: ActionTypes.ON_ERROR,
            useCase: this,
            error: error
        };
        this.dispatch(payload);
    }
}