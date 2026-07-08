class ApiREsponse{
    constructor(statusCode,data,messga="Success"){
        this.statusCode=statusCode,
        this.data=data,
        this.message=messga
        this.success=statusCode<400
    }
}