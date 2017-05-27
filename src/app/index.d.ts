interface IRootScopeServiceGlobals extends angular.IRootScopeService{
    globals:any;
}

interface IScopeAuth extends angular.IScope{
    error:any;
    dataLoading:any;
    username:string;
    password:string;
    login:Function;
}

interface IScopeRegister extends angular.IScope{
    error:any;
    dataLoading:any;
    username:string;
    password:string;
    register:Function;
}

interface jwtOptionsProvider {
    config:Function,
    $get:Function
}