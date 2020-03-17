# SequenceProcessWebhook

# 실행 환경 / nodejs 
- 아래 링크에서 [node](https://nodejs.org/ko/)를 설치하세요 

# 운영 환경에 맞게 Orchestrator 및 접속정보 수정 
```javascript
var MY_TENANT_ID = 1;  // 운영환경에 맞게 수정
var CONNECTION_ORCHE_URL = 'https://cloud.uipath.com'; // 환경에 맞게 수정 
var CONNECTION_TENANT_TENANT = 'tenantName'; // 운영환경에 맞게 수정
var CONNECTION_USER_ID_TENANT = 'Username'; // 운영환경에 맞게 수정
var CONNECTION_USER_PWD_TENANT = 'Password'; // 운영환경에 맞게 수정
```

# 연속적으로 수행될 작업에 대한 정보 
```javascript
var TARGET_MACHINENAME = 'charlespc'; // 실행된 Machine 이름 
var TARGET_JOB_LIST = [ '93992ef1-fed3-4045-8fe4-989b3f8407e6', 
                        '1d1438a8-8cba-4c7e-9cf5-e43636127624', 
                        'ccf65462-1525-40c9-a500-8cb81f8c4044' , 
                        '7f4142b8-f043-45e0-97a2-9b8511d1ea95']  // 연속적으로 수행된 프로세스 리스트 
var TARGET_JOB_IN_ARGS = { '93992ef1-fed3-4045-8fe4-989b3f8407e6' : { YourName: 'Hyungsoo Kim' }, 
                            '1d1438a8-8cba-4c7e-9cf5-e43636127624' : {},
                            'ccf65462-1525-40c9-a500-8cb81f8c4044': {},
                            '7f4142b8-f043-45e0-97a2-9b8511d1ea95': {}  }; //프로세스당 입력 인수 정보 
````
1. TARGET_MACHINENAME : 프로세스가 수행될 robot의 Machine 이름
2. TARGET_JOB_LIST : 여러개의 프로세스(Release Key), 첫번째 프로세스는 스케줄을 통해서 실행되어야 함. 
3. TARGET_JOB_IN_ARGS : 프로세스에 넘겨줘야 할 매개인수 정보, JSON 포맷으로 기술 함 

# webhook 설정 (port 정보)
```javascript 
var port = normalizePort(process.env.PORT || '3001');
app.set('port', port);
```
- 환경변수(PORT)로 명시를 해주거나, bin/www 파일에 명시된 3001을 수정. 

# 추가 모듈 설치하기 
```
[ec2-user@ip-172-31-39-181 sequenceprocesswebhook]$ npm install 
```

# 실행하기 
```
[ec2-user@ip-172-31-39-181 sequenceprocesswebhook]$ npm start  
```
