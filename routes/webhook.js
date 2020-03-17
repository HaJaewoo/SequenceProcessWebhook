var express = require('express');
const Orchestrator = require('./orchestrator');
var router = express.Router();

var MY_TENANT_ID = 1;  /// 운영에서 수정
var CONNECTION_ORCHE_URL = 'https://uipath.myrobots.co.kr/'; /// 운영에서 수정
var CONNECTION_TENANT_TENANT = 'tenantName'; /// 운영에서 수정
var CONNECTION_USER_ID_TENANT = 'Username'; /// 운영에서 수정
var CONNECTION_USER_PWD_TENANT = 'Password'; /// 운영에서 수정

var TARGET_MACHINENAME = 'charlespc'; // 실행된 Machine 이름 
var TARGET_JOB_LIST = [ '93992ef1-fed3-4045-8fe4-989b3f8407e6', 
                        '1d1438a8-8cba-4c7e-9cf5-e43636127624', 
                        'ccf65462-1525-40c9-a500-8cb81f8c4044' , 
                        '7f4142b8-f043-45e0-97a2-9b8511d1ea95']  // 연속적으로 수행된 프로세스 리스트 
var TARGET_JOB_IN_ARGS = { '93992ef1-fed3-4045-8fe4-989b3f8407e6' : { YourName: 'Hyungsoo Kim' }, 
                            '1d1438a8-8cba-4c7e-9cf5-e43636127624' : {},
                            'ccf65462-1525-40c9-a500-8cb81f8c4044': {},
                            '7f4142b8-f043-45e0-97a2-9b8511d1ea95': {}  }; //프로세스당 입력 인수 정보 
var TARGET_JOB_INDEX = 0;

var targetOU; 


function DebugLog(level,str_){
    var str =""; for(var i=0;i<level;i++)str += "  ";
    var date = new Date();
    console.log(date  + str + str_);
}

function handleJobCompletion( req ) {
    /* just start next job from waited assets */
    req.body['robot']
}
/*
  job에 대한 로그 처리  
*/
router.post('/', function(req, res, next) {
    let type = req.body['Type']
    let tenant = req.body['TenantId']

    if( tenant == MY_TENANT_ID || tenant == 1) { // 기대하는 Tenant 이고 

        let CURRENT_LIC_CNT = 0;
        if(type == 'job.created'){
            DebugLog(2,'Start Job Created Process.');

        }
        else if(type == 'job.started' || type == 'job.stopped'  )
        { 
            DebugLog(2,'Start Job '+type+' Process.');

        }
        else if(type == 'job.completed' || type == 'job.faulted')
        {
            handleJobCompletion(req);
            
            let orch = new Orchestrator(CONNECTION_TENANT_TENANT, CONNECTION_USER_ID_TENANT, CONNECTION_USER_PWD_TENANT, CONNECTION_ORCHE_URL)
            DebugLog(2,'Start Job Completed Process.');

            let job = req.body['Job']
            DebugLog(3,"===============Current Job");
            console.log( req.body)
    
            let Robot = job['Robot'];
            let Release = job['Release'];
            let CurrentMachineName = Robot['MachineName'];
            DebugLog(3,"===============CurrentMachineName:" + CurrentMachineName);
            //처음 시작해야 하는 job 정보 
            if( CurrentMachineName == TARGET_MACHINENAME && Release['Key'] == TARGET_JOB_LIST[0] )
                TARGET_JOB_INDEX = 0;
            if( CurrentMachineName == TARGET_MACHINENAME && TARGET_JOB_INDEX < TARGET_JOB_LIST.length-1)
            {
                TARGET_JOB_INDEX++;
                //수행되어야 할 새로운 Job을 실행 시켜 줌 
                let payload = {
                  startInfo: {
                    ReleaseKey: TARGET_JOB_LIST[TARGET_JOB_INDEX],
                    Strategy: "Specific",
                    RobotIds: [
                      Robot['Id']
                    ],
                    InputArguments: JSON.stringify(TARGET_JOB_IN_ARGS[ TARGET_JOB_LIST[TARGET_JOB_INDEX]])
                  }
                }
                console.log( JSON.stringify(payload));
                let resp = orch.startJob( payload)
            }
        }

    }
    res.sendStatus(202);
});



module.exports = router;
