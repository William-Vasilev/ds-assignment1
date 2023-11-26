import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { Construct } from "constructs";
import { generateBatch } from "../shared/util";
import { movies, movieCasts } from "../seed/movies";
import * as apig from "aws-cdk-lib/aws-apigateway";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as node from "aws-cdk-lib/aws-lambda-nodejs";


type AppApiProps = {
  userPoolId: string;
  userPoolClientId: string;
};


// export class AppApi extends Construct {
//   constructor(scope: Construct, id: string, props: AppApiProps) {
//     super(scope, id);


export class RestAPIStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Tables 

    const reviewsTable = new dynamodb.Table(this, "ReviewsTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "movieId", type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: 'reviewerName', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "Reviews",
    });

    
    // Functions 
  

       
        const addReviewFn = new lambdanode.NodejsFunction(this, "AddReviewFn", {
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_16_X,
          entry: `${__dirname}/../lambdas/addMovieReview.ts`,
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
            REVIEWS_TABLE_NAME: reviewsTable.tableName, 
          },
        });

        const getMovieReviewsFn = new lambdanode.NodejsFunction(
          this,
          "GetMovieReviewsFn", {
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_16_X,
          entry: `${__dirname}/../lambdas/getMovieReviews.ts`,
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
            REVIEWS_TABLE_NAME: reviewsTable.tableName,
          },
        });

        const getMovieReviewsByReviewerFn = new lambdanode.NodejsFunction(
          this,
          "GetMovieReviewsByReviewerFn", {
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_16_X,
          entry: `${__dirname}/../lambdas/getMovieReviewsByReviewer.ts`,
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
            REVIEWS_TABLE_NAME: reviewsTable.tableName,
          },
        });

        const updateReviewFn = new lambdanode.NodejsFunction(this, "UpdateReviewFn", {
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_16_X,
          entry: `${__dirname}/../lambdas/updateMovieReview.ts`, 
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
            REVIEWS_TABLE_NAME: reviewsTable.tableName,
          },
        });

        
        const getMovieReviewsByYearFn = new lambdanode.NodejsFunction(
          this,
          "GetMovieReviewsByYearFn", {
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_16_X,
          entry: `${__dirname}/../lambdas/getMovieReviewsByYear.ts`, // Create a new file for this Lambda function
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
            REVIEWS_TABLE_NAME: reviewsTable.tableName,
          },
        });
        
        const getMovieReviewsByReviewerNameFn = new lambdanode.NodejsFunction(
          this,
          "GetMovieReviewsByReviewerNameFn", {
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_16_X,
          entry: `${__dirname}/../lambdas/getMovieReviewsByReviewerName.ts`,
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
            REVIEWS_TABLE_NAME: reviewsTable.tableName,
          },
        });

        // const appCommonFnProps = {
        //   architecture: lambda.Architecture.ARM_64,
        //   timeout: cdk.Duration.seconds(10),
        //   memorySize: 128,
        //   runtime: lambda.Runtime.NODEJS_16_X,
        //   handler: "handler",
        //   environment: {
        //     USER_POOL_ID: props.userPoolId,
        //     CLIENT_ID: props.userPoolClientId,
        //     REGION: cdk.Aws.REGION,
        //   },
        // };
    
    
        // const authorizerFn = new node.NodejsFunction(this, "AuthorizerFn", {
        //   ...appCommonFnProps,
        //   entry: "./lambdas/auth/authorizer.ts",
        // });
    
        // const requestAuthorizer = new apig.RequestAuthorizer(
        //   this,
        //   "RequestAuthorizer",
        //   {
        //     identitySources: [apig.IdentitySource.header("cookie")],
        //     handler: authorizerFn,
        //     resultsCacheTtl: cdk.Duration.minutes(0),
        //   }
        // );

        
        
        // Permissions 
        reviewsTable.grantReadWriteData(addReviewFn);
        reviewsTable.grantReadData(getMovieReviewsFn);
        reviewsTable.grantReadData(getMovieReviewsByReviewerFn);
        reviewsTable.grantReadWriteData(updateReviewFn);
        reviewsTable.grantReadData(getMovieReviewsByYearFn);
        reviewsTable.grantReadData(getMovieReviewsByReviewerNameFn);


        //Rest API
        const api = new apig.RestApi(this, "RestAPI", {
          description: "demo api",
          deployOptions: {
            stageName: "dev",
          },
          
          defaultCorsPreflightOptions: {
            allowHeaders: ["Content-Type", "X-Amz-Date"],
            allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
            allowCredentials: true,
            allowOrigins: ["*"],
          },
        });
    
        // const appApi = new apig.RestApi(this, "AppApi", {
        //   description: "App RestApi",
        //   endpointTypes: [apig.EndpointType.REGIONAL],
        //   defaultCorsPreflightOptions: {
        //     allowOrigins: apig.Cors.ALL_ORIGINS,

        //   },
        // });
    
        //
        // const protectedRes = appApi.root.addResource("protected");
    
        // const publicRes = appApi.root.addResource("public");
    
        // const protectedFn = new node.NodejsFunction(this, "ProtectedFn", {
        //   ...appCommonFnProps,
        //   entry: "./lambdas/protected.ts",
        // });
    
        // const publicFn = new node.NodejsFunction(this, "PublicFn", {
        //   ...appCommonFnProps,
        //   entry: "./lambdas/public.ts",
        // });
        
    
        const moviesEndpoint = api.root.addResource("movies");
    //     moviesEndpoint.addMethod(
    //       "GET",
    //       new apig.LambdaIntegration(getAllMoviesFn, { proxy: true })
    //     );
    
        const movieEndpoint = moviesEndpoint.addResource("{movieId}");
    

//////////////////////////////REVIEW ENDPOINTS////////////////////////////////////

const reviewsEndpoint = moviesEndpoint.addResource("reviews");
const movieReviewsEndpoint = movieEndpoint.addResource("reviews");
const reviewEndpoint = movieReviewsEndpoint.addResource("{reviewerName}");

const allReviewsByReviewerEndpoint = moviesEndpoint.addResource("reviewsByReviewer")
const reviewEndpointReviwerName = allReviewsByReviewerEndpoint.addResource("{reviewerName}");

const reviewsByYear = movieEndpoint.addResource("reviewsByYear");
const movieReviewsByYearEndpoint = reviewsByYear.addResource("{year}");





reviewsEndpoint.addMethod(
  "POST",
  new apig.LambdaIntegration(addReviewFn, { proxy: true })
);
    
        

movieReviewsEndpoint.addMethod(
          "GET",
          new apig.LambdaIntegration(getMovieReviewsFn, { proxy: true })
        );



        reviewEndpoint.addMethod(
          "GET",
          new apig.LambdaIntegration(getMovieReviewsByReviewerFn, { proxy: true })
        );

        reviewEndpointReviwerName.addMethod(
          "GET",
          new apig.LambdaIntegration(getMovieReviewsByReviewerNameFn, { proxy: true })
        );

        reviewEndpoint.addMethod(
          "PUT",
          new apig.LambdaIntegration(updateReviewFn, { proxy: true })
        );
        
        
        movieReviewsByYearEndpoint.addMethod(
          "GET",
          new apig.LambdaIntegration(getMovieReviewsByYearFn, { proxy: true })
        );
       

        // protectedRes.addMethod("GET", new apig.LambdaIntegration(protectedFn), {
        //   authorizer: requestAuthorizer,
        //   authorizationType: apig.AuthorizationType.CUSTOM,
        // });
    
        // publicRes.addMethod("GET", new apig.LambdaIntegration(publicFn));
      }

       }
    
    