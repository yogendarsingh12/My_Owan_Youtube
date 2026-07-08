class ApiError extends Error {
    constructor(
        statusCode,
        message = "something went wrong",
        error = []
    ) {
        super(message)
        this.statusCode=statusCode
        this.data=null
        this.success=false
        

    }
}