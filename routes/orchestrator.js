"use strict";
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const crypto = require('crypto');

/*
class AuthToken {
	constructor( reToken) {
		this.refreshToken = reToken;
	}
	refreshToken() {
		var xhttp = new XMLHttpRequest();
		xhttp.withCredentials = true;

		// Compose request
		xhttp.open('POST', 'https://account.uipath.com/oauth/token', false);
		xhttp.setRequestHeader('Content-Type', 'application/json');
		xhttp.send( { grant_type: 'refresh_token',
						client_id: '5v7PmPJL6FOGu6RB8I1Y4adLBhIwovQN',
					refresh_token: this.refreshToken });
		if ( xhttp.status == 200) {
			let resp = JSON.parse( xhttp.responseText)
			return resp['access_token']
		}
	}
}
*/

class Orchestrator {
  
  constructor(tenant, user, pass, url) {
		process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
		this.url = url || 'https://platform.uipath.com/';
		this.token = this.token || this.getToken(tenant,user,pass) 
  	//Orchestrator.token = Orchestrator.token || this.getToken(tenant, user, pass);
  }


  getToken(tenant, user, pass) {
  	let body = JSON.stringify({tenancyName: tenant, usernameOrEmailAddress: user, password: pass});
  	return this.requestAuth({ type: "POST", 
			      extension: 'api/Account/Authenticate', 
			      body: body });
  }

  createOU( data) {
	let body = JSON.stringify( data)
	let result = this.requestSync( { type: 'POST',
					extension: 'odata/OrganizationUnits',
					body: body});
	return result;
  }

  getOUs() {
  	let result = this.requestSync( {type: 'GET',
						extension: 'odata/OrganizationUnits'});
	return result;
  }

  createAsset( data, ou ) {
	  let body = JSON.stringify(data)
	  let res = this.requestSync( { type: 'POST',
					extension: 'odata/Assets',
					ou: ou,
					body: body});
  	return res;
  }

  deleteAsset( assetId, ou) {
	  let res = this.requestSync( {type: 'DELETE',
				extension: `odata/Assets(${assetId})`,
				ou: ou})
	  return res;
  }


  getAssets( unit) {
	  let res = this.requestSync( {
			type: 'GET',
			extension: 'odata/Assets',
			ou: unit.Id});
	  return res;
  }

  migrateUnits( newTenantOrch) {
	 let units = this.getOUs()['value']
	 units.forEach( (elm,idx) => {
		newTenantOrch.createOU( {'DisplayName': elm.DisplayName})
	 });
  }

  getLicenseRuntime( robotType) {
	  return this.requestSync( {type: 'GET', extension: `odata/LicensesRuntime/UiPath.Server.Configuration.OData.GetLicensesRuntime(robotType='${robotType}')?$select=MachineName%2CIsOnline%2CIsLicensed%2CEnabled`})
  }

  getTenants( id) {
	  return this.requestSync( {type: 'GET', extension: `odata/Tenants(${id})`})
  }

  getBotsForEnv( id) {
	  return this.requestSync( {type: 'GET', extension: `odata/Environments/UiPath.Server.Configuration.OData.GetRobotsForEnvironment(key=${id})`})
  }

  toggleLicense( robotType, machineKey, onoff) {
		console.log("    START toggleLicense===================")
	  	let payload = { key: "string",
  				robotType: "NonProduction",
				  enabled: true };
		payload['robotType'] = robotType;
		payload['key']	= machineKey;
		payload['enabled'] = onoff;
		//console.log("    machineKey=" + machineKey);
		console.log( JSON.stringify(payload))
		if(false){
			return this.requestSync( {type: 'GET', extension: `odata/LicensesRuntime/UiPath.Server.Configuration.OData.GetLicensesRuntime(robotType='${robotType}')?$select=MachineName%2CIsOnline%2CIsLicensed%2CEnabled`})

		}else{
//			let res =  this.requestSync( {type: 'POST',	extension: `odata/LicensesRuntime('${machineKey}')/UiPath.Server.Configuration.OData.ToggleEnabled`,ou: ou,body: JSON.stringify(payload)});
			let res =  this.requestSync( {type: 'POST',	extension: `odata/LicensesRuntime('${machineKey}')/UiPath.Server.Configuration.OData.ToggleEnabled`,body: JSON.stringify(payload)});
			console.log(res);	
			return res;
	
		}
  }

  getReleases(key, ou) {
	return this.requestSync( {type: 'GET', extension: `odata/Releases?$filter=ProcessKey%20eq%20'${key}'`, ou: ou})
  }
  getRunningJobs( ou) {
	  return this.requestSync( {type: 'GET', extension: "odata/Jobs?$filter=HostMachineName%20ne%20null%20and%20EndTime%20eq%20null%20", ou: ou})
  }
  getPendingJobs() {
	return this.requestSync( {type: 'GET', extension: `odata/Jobs?$filter=HostMachineName%20eq%20null%20and%20State%20eq%20'Pending'`})
  }

  getAllMachineNames() {
	  return this.requestSync( {type: 'GET', extension: 'odata/Machines?$select=Name'})
  }

  getAllRobots( ou) {
	  return this.requestSync( {type: 'GET', extension: 'odata/Robots?$select=Id%2C%20MachineName%2C%20Name%2C%20RobotEnvironments', ou: ou})
  }

  migrateAssets( newTenantOrch ) {
	  let units = this.getOUs()["value"];
	  let targetou = newTenantOrch.getOUs()['value'];
	  units.forEach( (elm,idx) => {
		  let assets = this.getAssets( elm)['value'];
		  assets.forEach( ass => {
			  if( ass.ValueScope == 'Global') {
				var body = { 
					Name: ass.Name,
					ValueScope: ass.ValueScope,
					ValueType: ass.ValueType }
				if ( ass.ValueType == 'Text') {
					body["StringValue"] = ass.StringValue;
					let err = newTenantOrch.createAsset( body, targetou[idx].Id)
				} else if ( ass.ValueType == 'Bool') {
					body["BoolValue"] = ass.BoolValue;
					let err = newTenantOrch.createAsset( body, targetou[idx].Id)
				} else if ( ass.ValueType == 'Integer') {
					body['IntValue'] = ass.IntValue;
					let err = newTenantOrch.createAsset( body, targetou[idx].Id)
				}
			}});  
	  });
    }

	getReleaseKey( name ) {
		let releases = this.requestSync( {
				type: 'GET',
				extension: encodeURI(`odata/Releases?$filter=contains(ProcessKey,'${name}')&$select=Key,ProcessKey`)
			});
		var rel_key = undefined;
		console.log(releases);
		releases['value'].every( (elm,idx) => {
			if( elm.ProcessKey == name) {
				rel_key = elm.Key;
				return false;
			}
		});
		return rel_key;
	}

	getRobotId( name) {
		let robots = this.requestSync( {
				type: 'GET',
				extension: encodeURI(`odata/Robots?$filter=contains(Name,'${name}')&$select=Id,Name`)
			});
		var robot_id = 0;
		//console.log(robots);
		robots['value'].every( (elm,idx) => {
			if( elm.Name == name) {
				robot_id = elm.Id;
				return false;
			}
		});
		return robot_id;
	}

	startJob( payload) {
		//console.log( JSON.stringify(payload));
		let job = this.requestSync( {
			type: 'POST',
			extension: 'odata/Jobs/UiPath.Server.Configuration.OData.StartJobs',
			body: JSON.stringify(payload) });
		return job
	}

	printToken() {
		console.log( "print Token................")
		console.log( this.token)
	}

	requestAsync(p) {
		var xhttp = new XMLHttpRequest();
		xhttp.withCredentials = true;

		// All but authentication is asynchronous. Use a callback to get the response
		if ( true) {
			xhttp.onreadystatechange = function() {
				if (this.readyState == this.DONE && this.status < 300) {
					let result = JSON.parse(this.responseText);
					p["callback"](result);
				}
			};
		}

		// Compose request
		xhttp.open(p["type"].toUpperCase(), this.url + p["extension"], true);
		xhttp.setRequestHeader('Content-Type', 'application/json');
		xhttp.setRequestHeader('Authorization', 'Bearer ' + (this.token || ''));
		if( p.hasOwnProperty('ou')) {
			xhttp.setRequestHeader('X-UIPATH-OrganizationUnitId', p["ou"]);
		}

		xhttp.send(p["body"]);
  }

  requestAuth(p) {
  	var xhttp = new XMLHttpRequest();
  	xhttp.withCredentials = true;

    // Compose request
    xhttp.open(p["type"].toUpperCase(), this.url + p["extension"], false);
    xhttp.setRequestHeader('Content-Type', 'application/json');
    xhttp.setRequestHeader('Authorization', 'Bearer ' + (this.token || ''));
    xhttp.send(p["body"]);

    // Authentication is synchronous, so just return the token.
    if (true) {
		console.log("Authenticated");
//		console.log( xhttp.responseText)
		let arr = JSON.parse(xhttp.responseText);
		if( !this.token)
			return arr["result"]
		else
			return arr;
    }
  }

  requestSync(p) {
		//console.log("requestSync START ======")
  	var xhttp = new XMLHttpRequest();
  	xhttp.withCredentials = true;
		//console.log("requestSync ======")
		//console.log(p)

    // Compose request
    xhttp.open(p["type"].toUpperCase(), this.url + p["extension"], false);
    xhttp.setRequestHeader('Content-Type', 'application/json');
	xhttp.setRequestHeader('Authorization', 'Bearer ' + (this.token || ''));
    if( p.hasOwnProperty('ou')) {
      xhttp.setRequestHeader('X-UIPATH-OrganizationUnitId', p["ou"]);
	}
	if( p.hasOwnProperty('body')) {
		xhttp.send( p["body"]);
	} else {
		xhttp.send();
	}

	 console.log('status : ' + xhttp.status);
    if ( xhttp.status >= 200 && xhttp.status < 300) {
		try {
			let resp= JSON.parse(xhttp.responseText);
			return resp;
		} catch (e)  {
			return xhttp.status;
		}
    } else {
			console.log( xhttp.responseText);
	  }
  }

}

module.exports = Orchestrator;

