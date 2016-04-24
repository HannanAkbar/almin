// LICENSE : MIT
"use strict";
const assert = require("assert");
import StoreGroup from "./UILayer/StoreGroup";
import UseCase from "./UseCase";
import UseCaseExecutor  from "./UseCaseExecutor";
import StoreGroupValidator from "./UILayer/StoreGroupValidator";
/**
 * The use should use onXXX instead of it
 * @type {{}}
 */
export const ActionTypes = {
    ON_WILL_EXECUTE_EACH_USECASE: "ON_WILL_EXECUTE_EACH_USECASE",
    ON_DID_EXECUTE_EACH_USECASE: "ON_DID_EXECUTE_EACH_USECASE",
    ON_ERROR: "ON_ERROR"
};
export default class Context {

    /**
     * @param {Dispatcher} dispatcher
     * @param {StoreGroup|Store} store
     */
    constructor({dispatcher, store}) {
        StoreGroupValidator.validateInstance(store);
        // central dispatcher
        this._dispatcher = dispatcher;
        this._storeGroup = store;

        /**
         * callable release handlers
         * @type {Function[]}
         * @private
         */
        this._releaseHandlers = [];
        // Implementation Note:
        // Delegate dispatch event to Store|StoreGroup from Dispatcher
        // Dispatch Flow: Dispatcher -> StoreGroup -> Store
        const releaseHandler = this._dispatcher.pipe(this._storeGroup);
        this._releaseHandlers.push(releaseHandler);
    }

    /**
     * return state value of StoreGroup.
     * @returns {*} states object of stores
     */
    getState() {
        return this._storeGroup.getState();
    }

    /**
     * if anyone store is changed, then call onChangeHandler
     * @param {function(changingStores: Store[])} onChangeHandler
     * @return {Function} release handler function.
     */
    onChange(onChangeHandler) {
        return this._storeGroup.onChange(onChangeHandler);
    }

    /**
     * @param {UseCase} useCase
     * @returns {UseCaseExecutor}
     * @example
     *
     * context.useCase(UseCaseFactory.create()).execute(args);
     */
    useCase(useCase) {
        assert(UseCase.isUseCase(useCase), `It should be instance of UseCase: ${useCase}`);
        return new UseCaseExecutor(useCase, this._dispatcher);
    }

    /**
     * called the {@link handler} with useCase when the useCase will do.
     * @param {function(useCase: UseCase, args: *)} handler
     */
    onWillExecuteEachUseCase(handler) {
        const releaseHandler = this._dispatcher.onDispatch(payload => {
            if (payload.type === ActionTypes.ON_WILL_EXECUTE_EACH_USECASE) {
                handler(payload.useCase, payload.args);
            }
        });
        this._releaseHandlers.push(releaseHandler);
        return releaseHandler;
    }

    /**
     * called the {@link handler} with user-defined payload object when a UseCase dispatch with payload.
     * This `onDispatch` is not called at built-in event. It is filtered by Context.
     * If you want to *All* dispatched event and use listen directly your `dispatcher` object.
     * In other word, listen the dispatcher of `new Context({dispatcher})`.
     * @param handler
     * @returns {Function}
     */
    onDispatch(handler) {
        const releaseHandler = this._dispatcher.onDispatch(payload => {
            // call handler, if payload's type is not built-in event.
            // It means that `onDispatch` is called when dispatching user event.
            if (ActionTypes[payload.type] !== undefined) {
                handler(payload.useCase);
            }
        });
        this._releaseHandlers.push(releaseHandler);
        return releaseHandler;
    }

    /**
     * called the {@link handler} with useCase when the useCase is done.
     * @param {function(useCase: UseCase)} handler
     */
    onDidExecuteEachUseCase(handler) {
        const releaseHandler = this._dispatcher.onDispatch(payload => {
            if (payload.type === ActionTypes.ON_DID_EXECUTE_EACH_USECASE) {
                handler(payload.useCase);
            }
        });
        this._releaseHandlers.push(releaseHandler);
        return releaseHandler;
    }

    /**
     * called the {@link errorHandler} with error when error is occurred.
     * @param {function(error: Error)} errorHandler
     * @returns {function(this:Dispatcher)}
     */
    onErrorDispatch(errorHandler) {
        const releaseHandler = this._dispatcher.onDispatch(payload => {
            if (payload.type === ActionTypes.ON_ERROR) {
                errorHandler(payload);
            }
        });
        this._releaseHandlers.push(releaseHandler);
        return releaseHandler;
    }

    /**
     * release all events handler.
     * You can call this when no more call event handler
     */
    release() {
        if (typeof this._storeGroup === "function") {
            this._storeGroup.release();
        }
        this._releaseHandlers.forEach(releaseHandler => releaseHandler());
        this._releaseHandlers.length = 0;
    }
}