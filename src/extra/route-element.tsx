import React from 'react';

interface RouteElementProps {
    key: string,
    routeParts: RoutePartData[]
 }
 
 interface RoutePartData {
    text: string,
    hint: string,
    done: boolean,
    onClick?: Function
 }

 function RouteElement({routeParts}: RouteElementProps) {
    return (
        <div className='routeElement'>
            Hello world!
        </div>
    );
 }

 export { RouteElement };
