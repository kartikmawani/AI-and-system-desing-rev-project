import {type  Request,  type Response } from 'express';
import { GoogleGenAI } from "@google/genai";
import {CircuitBreaker} from "opossum"


const ai = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });
 
const Sleep=(delay:number)=>new Promise((resolve)=>{setTimeout(resolve,delay)})
const delay=(attempt:number)=>{ 
  const base=0.5
  const Max=3
  const exponentiol=base*Math.pow(2,attempt)
  const calculatedSleep=Math.min(Max,exponentiol)
  const sleep=Math.random()*calculatedSleep
  return sleep
  }
  let  attempt=0

export const queryHandler = async (req: Request, res: Response) => {
   
    const query = req.body?.query || req.body?.prompt;
  
    if (!query || typeof query !== "string") {
      return res.status(400).json({
        correlationId,
        error: "Missing required 'query' string in request body",
      });
    }
   
    while(true){
            attempt++
    const controller=new AbortController();
    const Timeout=setTimeout(() => {
       controller.abort()
    },5000);
    try {
      // Day 3: Direct model call (deliberately naive)
     
      const result = await ai.models.generateContent({
        model: ENV.MODEL_NAME,
        contents: query,
        signal:controller.signal
      });
   
  
      return res.status(200).json({
        correlationId,
        response:result,
      });
    } catch (error: any) {
        if(error.status==429 || error.status==503||error.status==505){
          if(attempt>4){
            return res.status(error.status || 500).json({
              correlationId,
              error: "Upstream inference error",
              details: error.message,
            });
          }
          const Time=delay(attempt)
           await  delay(Time) 
        }
        else{
      
        }
     
    }
    finally{
        clearTimeout(Timeout)
    }  
  };
}

const options={
  timeout: 3000, // If our function takes longer than 3 seconds, trigger a failure
  errorThresholdPercentage: 50, // When 50% of requests fail, trip the circuit
  resetTimeout: 30000 // After 30 seconds, try again.
}

const breaker = new CircuitBreaker(queryHandler, options);
breaker.fallback(() => 'Sorry, out of service right now');


//here we have use exponential backoff with jitter
//AbortController for time limit of each call with clearTimeout to remove overhead
//Rate limiting is performed by counter variable 
//Added circuit breaker which imitates electrical circuit open,close,half open
// close state when everything goest fine.
// when service encounter failure it goes to open state it is decided based on the service response or
// if the service continuously giving error prone response then  it will go to open state
// after some time of open state the state will go in half open statae where it will check if 
// the service is performing and returning responses then it will go in close state otherwise
// it will redirect it to open state untill the same situtation happens again discussed in the above .
//more info go to 90 days ai backend engineer roadmap 