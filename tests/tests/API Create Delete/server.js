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

var resource,
	async = require( "async" ),
	utils = require( "../../assert-to-console" ),
	device = require( "../../../index" )(),
	uuid = process.argv[ 2 ];

console.log( JSON.stringify( { assertionCount: 5 } ) );

async.series( [
	function initDevice( callback ) {
		device.configure( {
			role: "server"
		} ).then( callback, callback );
	},

	function registerResource( callback ) {
		device.registerResource( {
			id: {
				path: "/a/" + uuid
			},
			resourceTypes: [ "core.light" ],
			interfaces: [ "oic.if.baseline" ],
			discoverable: true,
			properties: {
				someProperty: "someValue"
			}
		} ).then( function( theResource ) {
			resource = theResource;
			callback();
		}, callback );
	},

	function processRequests( callback ) {
		var done,
			requestIndex = 0,
			requestHandler = function( request ) {
				switch ( requestIndex ) {

				// Both the initial "create" request and the subsequent duplicate "create"
				// request are handled by the same code. The expected behaviour is asserted by
				// the client.
				case 0:
				case 1:
					utils.assert( "strictEqual", request.type, "create",
						"Server: " + ( requestIndex === 0 ? "First" : "Second" ) +
						" request is 'create'" );
					utils.assert( "deepEqual", request.res, {
						discoverable: true,
						id: {
							deviceId: device.settings.info.uuid,
							path: "/a/new-resource"
						},
						resourceTypes: [ "core.light" ],
						interfaces: [ "oic.if.baseline" ],
						properties: {
							someKey: "someValue",
							"if": "oic.if.baseline",
							"rt": "core.light"
						}
					}, "Server: Resource signature is as expected" );
					device.registerResource( request.res ).then(
						function( theResource ) {
							resource = theResource;
							request.sendResponse( null ).catch( done );
						},
						function( error ) {
							request.sendError( error ).catch( done );
						} );
					break;

				case 2:
					utils.assert( "strictEqual", request.type, "delete",
						"Server: Third request is 'delete'" );
					device.unregisterResource( resource ).then(
						function() {
							request.sendResponse( null ).then( done, done );
						},
						function( error ) {
							request.sendError( error ).then( done, done );
						} );
					break;

				default:
					done( new Error( "Unexpected request" ) );
					break;
				}
				requestIndex++;
			};
		done = function( error ) {
			device.removeEventListener( "request", requestHandler );
			callback( error );
		};
		device.addEventListener( "request", requestHandler );
		console.log( JSON.stringify( { ready: true } ) );
	}

], function( error ) {
	if ( error ) {
		utils.die( "Client: Error " + error.message + " and result " + error.result );
	}
} );
