// Copyright 2016 Intel Corporation
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var resourceCreatedByRemote,
	device = require( "iotivity-node" )(),
	_ = require( "lodash" ),
	settings = {
		role: "server",
		info: {
			name: "api-server-example",
			manufacturerName: "Intel",
			manufactureDate: "Wed Sep 23 10:04:17 EEST 2015",
			platformVersion: "1.0.1",
			firmwareVersion: "0.0.1",
			supportUrl: "http://example.com/"
		}
	};

function throwError( error ) {
	console.error( error.stack ? error.stack : ( error.message ? error.message : error ) );
	process.exit( 1 );
}

device.configure( settings ).then(
	function() {
		device.addEventListener( "request", function( request ) {
			console.log( JSON.stringify( request, null, 4 ) );
			if ( request.type === "create" ) {
				console.log( "create request" );
				device.registerResource( _.extend( request.res, {
					discoverable: true
				} ) ).then( function( resource ) {
					console.log( "resource successfully registered" );
					resourceCreatedByRemote = resource;
					request.sendResponse( null );
				}, _.bind( request.sendError, request ) );
				return;
			} else if ( request.type === "delete" ) {
				console.log( "delete request" );
				if ( request.target.id.path === resourceCreatedByRemote.id.path &&
						request.target.id.deviceId === resourceCreatedByRemote.id.deviceId ) {
					device.unregisterResource( resourceCreatedByRemote ).then(
						function() {
							console.log( "resource successfully deleted" );
							request.sendResponse( null );
						},
						_.bind( request.sendError, request ) );
				}
			}
		} );

		device.registerResource( {
			id: {
				path: "/a/high-level-resource-creation-example"
			},
			resourceTypes: [ "core.light" ],
			interfaces: [ "oic.if.baseline" ],
			discoverable: true,
			observable: true,
			properties: { someValue: 0, someOtherValue: "Helsinki" }
		} ).then( function() {
			console.log( "initial resource successfully registered" );
		}, throwError );
	}, throwError );
