"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const zod_1 = require("zod");
function validate(schema) {
    return (req, res, next) => {
        try {
            if (schema.body)
                req.body = schema.body.parse(req.body);
            if (schema.query)
                req.query = schema.query.parse(req.query);
            if (schema.params)
                req.params = schema.params.parse(req.params);
            return next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return res.status(400).json({
                    ok: false,
                    message: "Validation error",
                    errors: error.flatten(),
                });
            }
            return next(error);
        }
    };
}
