import { RestError } from '@azure/core-http';
import { getErrorMessage } from '../src/util'

describe('util', () => {

    it('getErrorMessage with no message', () => {
        const error = new Error();
        const message = getErrorMessage(error);

        expect(message).toBe("");
    })

    it('getErrorMessage with message', () => {
        const error = new Error("<message>");
        const message = getErrorMessage(error);

        expect(message).toBe("<message>");
    })

    it('getErrorMessage with description', () => {
        const error = new Error("<message>");
        const message = getErrorMessage(error, "<description>");

        expect(message).toBe("<description>");
    })

    it('getErrorMessage with RestError and message', () => {
        const error = new RestError("<message>");
        const message = getErrorMessage(error);

        expect(message).toBe("<message>");
    })

    it('getErrorMessage with RestError with string status', () => {
        const error = new RestError("<message>", RestError.REQUEST_SEND_ERROR);
        const message = getErrorMessage(error);

        expect(message).toBe(`<message> Status code: ${RestError.REQUEST_SEND_ERROR}`);
    })

    it('getErrorMessage with RestError with number status', () => {
        const error = new RestError("<message>", undefined, 401);
        const message = getErrorMessage(error);

        expect(message).toBe("<message> Status code: 401 Unauthorized");
    })

    it('getErrorMessage with RestError with unknown number status', () => {
        const error = new RestError("<message>", undefined, 12345);
        const message = getErrorMessage(error);

        expect(message).toBe("<message> Status code: 12345");
    })
})
