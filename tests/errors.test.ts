import { RestError } from '@azure/core-http';

import { getErrorMessage, ArgumentError, ParseError } from '../src/errors'

describe('errors', () => {

    it('getErrorMessage with Error and no message', () => {
        const error = new Error();
        const message = getErrorMessage(error);

        expect(message).toBe("An unknown error occurred.");
    })

    it('getErrorMessage with Error and message', () => {
        const error = new Error("<message>");
        const message = getErrorMessage(error);

        expect(message).toBe("An unknown error occurred.");
    })

    it('getErrorMessage with Error and description', () => {
        const error = new Error("<message>");
        const message = getErrorMessage(error, "<description>");

        expect(message).toBe("<description>");
    })

    it('getErrorMessage with ArgumentError and no message', () => {
        const error = new ArgumentError();
        const message = getErrorMessage(error);

        expect(message).toBe("An unknown error occurred.");
    })

    it('getErrorMessage with ArgumentError and message', () => {
        const error = new ArgumentError("<message>");
        const message = getErrorMessage(error);

        expect(message).toBe("<message>");
    })

    it('getErrorMessage with ArgumentError, message and description', () => {
        const error = new ArgumentError("<message>");
        const message = getErrorMessage(error, "<description>");

        expect(message).toBe("<description> <message>");
    })

    it('getErrorMessage with ParseError and no message', () => {
        const error = new ParseError();
        const message = getErrorMessage(error);

        expect(message).toBe("An unknown error occurred.");
    })

    it('getErrorMessage with ParseError and message', () => {
        const error = new ParseError("<message>");
        const message = getErrorMessage(error);

        expect(message).toBe("<message>");
    })

    it('getErrorMessage with ParseError, message, and description', () => {
        const error = new ParseError("<message>");
        const message = getErrorMessage(error, "<description>");

        expect(message).toBe("<description> <message>");
    })

    it('getErrorMessage with RestError and message', () => {
        const error = new RestError("<message>");
        const message = getErrorMessage(error);

        expect(message).toBe("An unknown error occurred.");
    })

    it('getErrorMessage with RestError, message, and description', () => {
        const error = new RestError("<message>");
        const message = getErrorMessage(error, "<description>");

        expect(message).toBe("<description>");
    })

    it('getErrorMessage with RestError and string status', () => {
        const error = new RestError("<message>", RestError.REQUEST_SEND_ERROR);
        const message = getErrorMessage(error);

        expect(message).toBe(`Status code: ${RestError.REQUEST_SEND_ERROR}`);
    })

    it('getErrorMessage with RestError and number status', () => {
        const error = new RestError("<message>", undefined, 401);
        const message = getErrorMessage(error);

        expect(message).toBe("Status code: 401 Unauthorized");
    })

    it('getErrorMessage with RestError and unknown number status', () => {
        const error = new RestError("<message>", undefined, 12345);
        const message = getErrorMessage(error);

        expect(message).toBe("Status code: 12345");
    })

    it('getErrorMessage with RestError, number status, and description', () => {
        const error = new RestError("<message>", undefined, 401);
        const message = getErrorMessage(error, "<description>");

        expect(message).toBe("<description> Status code: 401 Unauthorized");
    })
})
