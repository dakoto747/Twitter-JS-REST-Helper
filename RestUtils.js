var hmacsha1 = require('hmacsha1');

const Constants = {
    //Dev Parse keys
    TWITTER_COMSUMER_KEY: "<Your twitter-app's consumer key>",
    TWITTER_CONSUMER_SECRET: "<Your twitter-app's consumer secret>",
};
export function _getSignature(user_auth_token, accesstoken_secret, data){
  // let signing_key = encodeURIComponent(Constants.TWITTER_CONSUMER_SECRET)+'&'+
  //                   encodeURIComponent(Constants.ACCESS_TOKEN_SECRET);
  let signing_key = encodeURIComponent(Constants.TWITTER_CONSUMER_SECRET)+'&'+
                    encodeURIComponent(accesstoken_secret);
  console.log('signing data');
  console.log(data);
  console.log('signing key');
  console.log(signing_key);
  return hmacsha1(signing_key, data);
}
/*
let include_entities_key = encodeURIComponent('include_entities');
let include_entities_val = encodeURIComponent('false');

let oauth_consumer_key_key = encodeURIComponent('oauth_consumer_key');
let oauth_consumer_key_val = encodeURIComponent(Constants.TWITTER_COMSUMER_KEY);

let oauth_nonce_key = encodeURIComponent('oauth_nonce');
let oauth_nonce_val = encodeURIComponent(_getNonce());

let oauth_signature_method_key = encodeURIComponent('oauth_signature_method');
let oauth_signature_method_val = encodeURIComponent('HMAC-SHA1');

let oauth_timestamp_key = encodeURIComponent('oauth_timestamp');
var val = Math.round(Date.now() / 1000);
let oauth_timestamp_val = encodeURIComponent(val);

let oauth_token_key = encodeURIComponent('oauth_token');
// let oauth_token_val = encodeURIComponent(Constants.ACCESS_TOKEN);
let oauth_token_val = encodeURIComponent(user_auth_token);

let oauth_version_key = encodeURIComponent('oauth_version');
let oauth_version_val = encodeURIComponent('1.0');

*/
export function _buildRequestHeader(user_auth_token, accesstoken_secret, url, parameter_dict, include_entities_bool, post){
  // https://dev.twitter.com/oauth/overview/creating-signatures
  // https://dev.twitter.com/oauth/overview/authorizing-requests
  // encodeURI componests when creating
  let params = {};
  if(include_entities_bool){
    params.include_entities = include_entities_bool;
  }
  params.oauth_consumer_key = Constants.TWITTER_COMSUMER_KEY;
  params.oauth_nonce = _getNonce();
  params.oauth_signature_method = 'HMAC-SHA1';
  var val = Math.round(Date.now() / 1000);
  params.oauth_timestamp = val;
  params.oauth_token = user_auth_token;
  params.oauth_version = '1.0';

  if(parameter_dict){
    Object.keys(parameter_dict).forEach(function(key) {
        // console.log(key, obj[key]);
        params[key] = parameter_dict[key];
    });
  }

  let parameter_keys = Object.keys(params).sort();
  let parameter_string = '';

  let i = 0;
  parameter_keys.forEach(key=>{
    if(i != parameter_keys.length-1){
      parameter_string += encodeURIComponent(key)+'='+encodeURIComponent(params[key])+'&';
    }else{
      parameter_string += encodeURIComponent(key)+'='+encodeURIComponent(params[key]);
    }
    i++
  });

  let data = _getBaseString(post?'POST':'GET', url,
                parameter_string);

  let signature = _getSignature(user_auth_token, accesstoken_secret, data)
  console.log('signature'+signature);


  params.oauth_signature = signature;
  parameter_keys = Object.keys(params).sort();
  // let oauth_signature_key = encodeURIComponent('oauth_signature');
  // let oauth_signature_val = encodeURIComponent(signature);

  let request_header_string = 'OAuth ';
  i=0;
  parameter_keys.forEach(key=>{
    if(i != parameter_keys.length-1){
      request_header_string += encodeURIComponent(key)+'="'+encodeURIComponent(params[key])+'", ';
    }else{
      request_header_string += encodeURIComponent(key)+'="'+encodeURIComponent(params[key])+'"';
    }
    i++;
  });
  console.log(request_header_string);
  return request_header_string;
}
export function _getBaseString(method, url, parameter_string){
  return method+'&'+
         encodeURIComponent(url)+'&'+encodeURIComponent(parameter_string);
}
export function _getNonce(){
  // https://stackoverflow.com/questions/10051494/oauth-nonce-value
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for(var i = 0; i < 42; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}


export function b64EncodeUnicode(str) {
    // first we use encodeURIComponent to get percent-encoded UTF-8,
    // then we convert the percent encodings into raw bytes which
    // can be fed into btoa.
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode('0x' + p1);
    }));
}

export async function fetchTimeline(tweet_count, success_callback, failure_callback){
  try {
    console.log('calling')

    const twitter_token = "<Your method to get the user's twitter token>";
    const twitter_tokenSecret = "<Your method to get the user's twitter token-secret>";
    if (twitter_tokenSecret !== null && twitter_token !== null){

    let base_url = 'https://api.twitter.com/1.1/statuses/home_timeline.json';//?count=60'

    let url = base_url+'?count='+tweet_count;
    let parameter_dict = {count: tweet_count};
    let header = _buildRequestHeader(twitter_token, twitter_tokenSecret, base_url, parameter_dict);

     return fetch(url, {
       method: 'GET',
       headers: {
         'Accept': '*/*',
         'Content-Type': 'application/x-www-form-urlencoded',
         'Authorization': header
       }
     }).then((response) =>{ return response.json()})
        .then((json) => {
          console.log(json);
          success_callback(json);
          return json;
        });

    }else{
      console.log('no data');
      failure_callback();
      return null;
    }
  } catch (error) {
    // Error retrieving data
    console.log('there was an error retrieving timeline');
    console.log(error);
    failure_callback();
    return null;
  }

}

export async function fetchUserTweets(screen_name, tweet_count, success_callback, failure_callback){
  // https://dev.twitter.com/rest/reference/get/statuses/user_timeline
  // GET https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name=twitterapi&count=2
  try {

    const twitter_token = "<Your method to get the user's twitter token>";
    const twitter_tokenSecret = "<Your method to get the user's twitter token-secret>";
    if (twitter_tokenSecret !== null && twitter_token !== null){
      let base_url = 'https://api.twitter.com/1.1/statuses/user_timeline.json';
      let url = base_url+'?screen_name='+screen_name+'&count='+tweet_count;

      let parameter_dict = {screen_name: screen_name, count: tweet_count};
      let header = _buildRequestHeader(twitter_token, twitter_tokenSecret, base_url, parameter_dict, false);


       fetch(url, {
         method: 'GET',
         headers: {
           'Accept': '*/*',
           'Content-Type': 'application/x-www-form-urlencoded',
           'Authorization': header
         }
       }).then((response) =>{ return response.json()})
          .then((json) => {
            console.log(json);
            success_callback(json);
            return json;
          });


    }else{
      console.log('no data');
      failure_callback();
      return null;
    }
  } catch (error) {
    // Error retrieving data
    console.log('there was an error retrieving timeline');
    console.log(error);
    failure_callback();
    return null;
  }
}


export async function fetchUserTweetsAfter(screen_name, tweet_id, tweet_count, success_callback, failure_callback){
  // https://dev.twitter.com/rest/reference/get/statuses/user_timeline
  // GET https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name=twitterapi&count=2
  try {
// max_id	optional	Returns results with an ID less than (that is, older than) or equal to the specified ID.
    const twitter_token = "<Your method to get the user's twitter token>";
    const twitter_tokenSecret = "<Your method to get the user's twitter token-secret>";
    if (twitter_tokenSecret !== null && twitter_token !== null){

    let base_url = 'https://api.twitter.com/1.1/statuses/user_timeline.json';

    let url = base_url+'?screen_name='+
              screen_name+'&count='+tweet_count+'&max_id'+tweet_id;
    parameter_dict={screen_name: screen_name, count: tweet_count, max_id: tweet_id};

    let header = _buildRequestHeader(twitter_token, twitter_tokenSecret, base_url, parameter_dict);
     fetch(url, {
       method: 'GET',
       headers: {
         'Accept': '*/*',
         'Content-Type': 'application/x-www-form-urlencoded',
         'Authorization': header
       }
     }).then((response) =>{ return response.json()})
        .then((json) => {
          console.log(json);
          success_callback(json);
          return json;
        });

    }else{
      console.log('no data');
      failure_callback();
      return null;
    }
  } catch (error) {
    // Error retrieving data
    console.log('there was an error retrieving timeline');
    console.log(error);
    failure_callback();
    return null;
  }
}

export async function likeStatus(tweet_id, success_callback, failure_callback){
// https://dev.twitter.com/rest/reference/post/favorites/destroy
// POST https://api.twitter.com/1.1/favorites/create.json?id=243138128959913986
try {
  const twitter_token = "<Your method to get the user's twitter token>";
  const twitter_tokenSecret = "<Your method to get the user's twitter token-secret>";
  if (twitter_tokenSecret !== null && twitter_token !== null){
    console.log(tweet_id);
    let base_url = 'https://api.twitter.com/1.1/favorites/create.json'
    let url = base_url+'?id='+tweet_id;

    parameter_dict = {id: tweet_id};
    console.log(url);
    let header = _buildRequestHeader(twitter_token, twitter_tokenSecret, base_url, parameter_dict, false, true);
     fetch(url, {
       method: 'POST',
       headers: {
         'Accept': '*/*',
         'Content-Type': 'application/x-www-form-urlencoded',
         'Authorization': header
       }
     }).then((response) =>{ return response.json()})
        .then((json) => {
          console.log(json);
          success_callback(json)
          return json;
        });

    }else{
      console.log('no data')
      failure_callback();
      return false;
    }
  } catch (error) {
    // Error retrieving data
    console.log('there was an error retrieving timeline');
    console.log(error);
    failure_callback();
    return true;
  }

}

export async function unlikeStatus(tweet_id, success_callback, failure_callback){
// https://dev.twitter.com/rest/reference/post/favorites/destroy
// POST https://api.twitter.com/1.1/favorites/destroy.json?id=243138128959913986
try {

  const twitter_token = "<Your method to get the user's twitter token>";
  const twitter_tokenSecret = "<Your method to get the user's twitter token-secret>";
  if (twitter_tokenSecret !== null && twitter_token !== null){
    let base_url = 'https://api.twitter.com/1.1/favorites/destroy.json'
    let url = base_url+'?id='+tweet_id;

    parameter_dict = {id: tweet_id};
    let header = _buildRequestHeader(twitter_token, twitter_tokenSecret, base_url, parameter_dict);
     fetch(url, {
       method: 'POST',
       headers: {
         'Accept': '*/*',
         'Content-Type': 'application/x-www-form-urlencoded',
         'Authorization': header
       }
     }).then((response) =>{ return response.json()})
        .then((json) => {
          console.log(json);
          success_callback(json);
          return json;
        });

    }else{
      console.log('no data')
      failure_callback();
      return false;
    }
  } catch (error) {
    // Error retrieving data
    console.log('there was an error retrieving timeline');
    console.log(error);
    failure_callback();
    return true;
  }

}

export async function retweetStatus(tweet_id, success_callback, failure_callback){
// POST https://api.twitter.com/1.1/statuses/retweet/243149503589400576.json
try {
  console.log('calling')

  const twitter_token = "<Your method to get the user's twitter token>";
  const twitter_tokenSecret = "<Your method to get the user's twitter token-secret>";
  if (twitter_tokenSecret !== null && twitter_token !== null){
    let url = 'https://api.twitter.com/1.1/statuses/retweet/'+tweet_id+'.json';
    console.log(url);
    let header = _buildRequestHeader(twitter_token, twitter_tokenSecret, url, {}, false, true);
     fetch(url, {
       method: 'POST',
       headers: {
         'Accept': '*/*',
         'Content-Type': 'application/x-www-form-urlencoded',
         'Authorization': header
       }
     }).then((response) =>{ return response.json()})
        .then((json) => {
          console.log(json);
          success_callback(json);
          return json;
        });

    }else{
      console.log('no data');
      failure_callback();
      return false;
    }
  } catch (error) {
    // Error retrieving data
    console.log('there was an error retrieving timeline');
    console.log(error);
    failure_callback();
    return true;
  }
}

export async function unRetweet(tweet_id, success_callback, failure_callback){
// POST https://api.twitter.com/1.1/statuses/unretweet/241259202004267009.json
try {
  console.log('calling')

  const twitter_token = "<Your method to get the user's twitter token>";
  const twitter_tokenSecret = "<Your method to get the user's twitter token-secret>";
  if (twitter_tokenSecret !== null && twitter_token !== null){
    let url = 'https://api.twitter.com/1.1/statuses/unretweet/'+tweet_id+'.json';
    let header = _buildRequestHeader(twitter_token, twitter_tokenSecret);
     fetch(url, {
       method: 'POST',
       headers: {
         'Accept': '*/*',
         'Content-Type': 'application/x-www-form-urlencoded',
         'Authorization': header
       }
     }).then((response) =>{ return response})
        .then((json) => {
          console.log(json);
          success_callback(json);
          return json;
        });

    }else{
      console.log('no data');
      failure_callback();
      return false;
    }
  } catch (error) {
    // Error retrieving data
    console.log('there was an error retrieving timeline');
    console.log(error);
    failure_callback();
    return true;
  }
}

export async function postStatus(status, success_callback, failure_callback){
// https://api.twitter.com/1.1/statuses/update.json
// POST https://api.twitter.com/1.1/statuses/update.json?status=Maybe%20he%27ll%20finally%20find%20his%20keys.%20%23peterfalk
// body: form?
try {
  console.log('calling')

  const twitter_token = "<Your method to get the user's twitter token>";
  const twitter_tokenSecret = "<Your method to get the user's twitter token-secret>";
  if (twitter_tokenSecret !== null && twitter_token !== null){
    let base_url = 'https://api.twitter.com/1.1/statuses/update.json';
    let url = base_url+'?status='+encodeURIComponent(status);
    let parameter_dict = {status: status};
    let header = _buildRequestHeader(twitter_token, twitter_tokenSecret, base_url, parameter_dict, false, true);
     fetch(url, {
       method: 'POST',
       headers: {
         'Accept': '*/*',
         'Content-Type': 'application/x-www-form-urlencoded',
         'Authorization': header
       },
      //  body: 'status='+encodeURIComponent(status)
     }).then((response) =>{
       console.log(response);
        return response})
        .then((json) => {
          console.log(json);
          success_callback(json);
          return json;
        });

    }else{
      console.log('no data')
      failure_callback();
      return false;
    }
  } catch (error) {
    // Error retrieving data
    console.log('there was an error retrieving timeline');
    console.log(error);
    failure_callback();
    return true;
  }
}

export async function quoteStatus(status, quoted_handle, quoted_status_id, success_callback, failure_callback){
  // https://twittercommunity.com/t/how-to-quote-some-text-with-a-retweet/69679
  /*
  Note: URLs for Quote Tweet or DM deep links that are typed or pasted into a Tweet
  will still count against the character limit. The new attachment_url parameter
  on the POST statuses/update endpoint will enable valid link formats to be attached to a Tweet.
  They will not count against the character limit when this method is used.
  The new attachment_url parameter
  */

  /*


  quote tweet is just an ordinary tweet with a permalink to another tweet at the end. So a call to https://dev.twitter.com/rest/reference/post/statuses/update21 with the text:

This is a quote tweet https://twitter.com/TwitterDev/status/740196895784570880

Will quote the tweet 740196895784570880 with your comment

1 Like
Reply

BurleyBrianJul '16
Thanks for your reply Igor. I tried it and it is working as expected.

I just want to clarify one more thing. When we append the link of parent tweet while retweeting, it (link of parent tweet) won't be accounted in 140 chars of tweet once twitter introduces the char count changes on 24th july.


Reply

IgorBrigadirRegularJul '16
As far as i can tell, according to https://dev.twitter.com/overview/api/upcoming-changes-to-tweets19 you'll need to specify the tweet permalink url in attachment_url parameter, then it won't count. But if you append the url to the end of the text, like above it will count towards 140 characters.
*/
try {
  const twitter_token = "<Your method to get the user's twitter token>";
  const twitter_tokenSecret = "<Your method to get the user's twitter token-secret>";
  if (twitter_tokenSecret !== null && twitter_token !== null){
    let attachment_url = 'https://twitter.com/'+quoted_handle+'/status/'+quoted_status_id;

    let base_url = 'https://api.twitter.com/1.1/statuses/update.json'
    let url = base_url+'?status='+
              encodeURIComponent(status)+'&'+
              'attachment_url='+attachment_url;
    parameter_dict = {status: status, attachment_url: attachment_url};
    let header = _buildRequestHeader(twitter_token, twitter_tokenSecret, base_url, parameter_dict, true);
     fetch(url, {
       method: 'POST',
       headers: {
         'Accept': '*/*',
         'Content-Type': 'application/x-www-form-urlencoded',
         'Authorization': header
       }
     }).then((response) =>{ return response.json()})
        .then((json) => {
          console.log(json);
          success_callback(json);
          return json;
        });

    }else{
      console.log('no data')
      failure_callback();
      return false;
    }
  } catch (error) {
    // Error retrieving data
    console.log('there was an error retrieving timeline');
    console.log(error);
    failure_callback();
    return true;
  }
}

export async function replyTweet(status, in_reply_to_status_id, success_callback, failure_callback){
  try {
    console.log('calling')

    const twitter_token = "<Your method to get the user's twitter token>";
    const twitter_tokenSecret = "<Your method to get the user's twitter token-secret>";
    if (twitter_tokenSecret !== null && twitter_token !== null){
      let base_url = 'https://api.twitter.com/1.1/statuses/update.json';
      let url = base_url+'?status='+
                encodeURIComponent(status)+'&'+
                'in_reply_to_status_id='+in_reply_to_status_id;
      let parameter_dict = {status: status, in_reply_to_status_id: in_reply_to_status_id};

      let header = _buildRequestHeader(twitter_token, twitter_tokenSecret, base_url, parameter_dict, true);
       fetch(url, {
         method: 'POST',
         headers: {
           'Accept': '*/*',
           'Content-Type': 'application/x-www-form-urlencoded',
           'Authorization': header
         }
       }).then((response) =>{ return response.json()})
          .then((json) => {
            console.log(json);
            success_callback(json);
            return json;
          });

      }else{
        console.log('no data')
        failure_callback();
        return false;
      }
    } catch (error) {
      // Error retrieving data
      console.log('there was an error retrieving timeline');
      console.log(error);
      failure_callback();
      return true;
    }
}


export async function follow(user_id, success_callback, failure_callback){
  // POST https://api.twitter.com/1.1/friendships/create.json?user_id=1401881&follow=true
  try {
    console.log('calling')

    const twitter_token = "<Your method to get the user's twitter token>";
    const twitter_tokenSecret = "<Your method to get the user's twitter token-secret>";
    if (twitter_tokenSecret !== null && twitter_token !== null){
      let base_url = 'https://api.twitter.com/1.1/friendships/create.json'
      let url = base_url+'?user_id='+user_id+
                '&follow=true';
      let parameter_dict = {user_id: user_id, follow: true};
      let header = _buildRequestHeader(twitter_token, twitter_tokenSecret, base_url, parameter_dict, true);
       fetch(url, {
         method: 'POST',
         headers: {
           'Accept': '*/*',
           'Content-Type': 'application/x-www-form-urlencoded',
           'Authorization': header
         }
       }).then((response) =>{ return response.json()})
          .then((json) => {
            console.log(json);
            success_callback(json);
            return json;
          });

      }else{
        console.log('no data');
        failure_callback();
        return false;
      }
    } catch (error) {
      // Error retrieving data
      console.log('there was an error retrieving timeline');
      console.log(error);
      failure_callback();
      return true;
    }
}

export async function unfollow(user_id, success_callback, failure_callback){
  // Object https://api.twitter.com/1.1/friendships/destroy.json?user_id=1401881
  try {
    console.log('calling')

    const twitter_token = "<Your method to get the user's twitter token>";
    const twitter_tokenSecret = "<Your method to get the user's twitter token-secret>";
    if (twitter_tokenSecret !== null && twitter_token !== null){
      let base_url = 'https://api.twitter.com/1.1/friendships/destroy.json';
      let url = base_url+'?user_id='+user_id;
      let parameter_dict = {user_id: user_id};
      let header = _buildRequestHeader(twitter_token, twitter_tokenSecret, base_url, parameter_dict, true);

       fetch(url, {
         method: 'POST',
         headers: {
           'Accept': '*/*',
           'Content-Type': 'application/x-www-form-urlencoded',
           'Authorization': header
         }
       }).then((response) =>{ return response.json()})
          .then((json) => {
            console.log(json);
            success_callback(json);
            return json;
          });

      }else{
        console.log('no data')
        failure_callback();
        return false;
      }
    } catch (error) {
      // Error retrieving data
      console.log('there was an error retrieving timeline');
      console.log(error);
      failure_callback();
      return true;
    }
}

export async function fetchFriendship(source_screen_name, target_screen_name, success_callback, failure_callback){
  // Returns detailed information about the relationship between two arbitrary users.
  // GET https://api.twitter.com/1.1/friendships/show.json?source_screen_name=bert&target_screen_name=ernie
/*
{
  "relationship": {
    "target": {
      "id_str": "12148",
      "id": 12148,
      "screen_name": "ernie",
      "following": false,
      "followed_by": false
    },
    "source": {
      "can_dm": false,
      "blocking": null,
      "muting": null,
      "id_str": "8649302",
      "all_replies": null,
      "want_retweets": null,
      "id": 8649302,
      "marked_spam": null,
      "screen_name": "bert",
      "following": false,
      "followed_by": false,
      "notifications_enabled": null
    }
  }
}
*/
  try {
// https://api.twitter.com/1.1/friendships/show.json?source_screen_name=bert&target_screen_name=ernie
    const twitter_token = "<Your method to get the user's twitter token>";
    const twitter_tokenSecret = "<Your method to get the user's twitter token-secret>";
    if (twitter_tokenSecret !== null && twitter_token !== null){

      let base_url='https://api.twitter.com/1.1/friendships/show.json'
      let url = base_url+'?source_screen_name='+
                source_screen_name+'&target_screen_name='+target_screen_name;
      let parameter_dict = {
        target_screen_name: target_screen_name,
        source_screen_name: source_screen_name
      };

      console.log(url);
      let header = _buildRequestHeader(twitter_token, twitter_tokenSecret, base_url, parameter_dict);
       fetch(url, {
         method: 'GET',
         headers: {
           'Accept': '*/*',
           'Content-Type': 'application/x-www-form-urlencoded',
           'Authorization': header
         },
         qs: {target_screen_name: target_screen_name, source_screen_name: source_screen_name}
       }).then((response) =>{ return response.json()})
          .then((json) => {
            console.log(json);
            success_callback(json);
            return json;
          });

      }else{
        console.log('no data');
        failure_callback();
        return false;
      }
    } catch (error) {
      // Error retrieving data
      console.log('there was an error retrieving timeline');
      console.log(error);
      failure_callback();
      return true;
  }
}

export async function getUserFriends(screen_name, success_callback, failure_callback){
// GET https://api.twitter.com/1.1/friends/list.json?cursor=-1&screen_name=twitterapi&skip_status=true&include_user_entities=false
  try {

    const twitter_token = "<Your method to get the user's twitter token>";
    const twitter_tokenSecret = "<Your method to get the user's twitter token-secret>";
    if (twitter_tokenSecret !== null && twitter_token !== null){
      let base_url = 'https://api.twitter.com/1.1/users/friends/list.json'
      let url = base_url+ '?cursor=-1&screen_name='+
                screen_name+'&skip_status=true&include_user_entities=false';

      let parameter_dict = {
          cursor: -1,
          screen_name: screen_name,
          skip_status: true,
          include_user_entities: false
      }
      let header = _buildRequestHeader(twitter_token, twitter_tokenSecret, base_url, parameter_dict);
       fetch(url, {
         method: 'GET',
         headers: {
           'Accept': '*/*',
           'Content-Type': 'application/x-www-form-urlencoded',
           'Authorization': header
         }
       }).then((response) =>{ return response.json()})
          .then((json) => {
            console.log(json);
            success_callback(json);
            return json;
          });

      }else{
        console.log('no data');
        failure_callback();
        return false;
      }
  } catch (error) {
    // Error retrieving data
    console.log('there was an error retrieving timeline');
    console.log(error);
    failure_callback();
    return true;
  }
}

export async function getUserFollowers(screen_name, success_callback, failure_callback){
// GET https://api.twitter.com/1.1/followers/list.json?cursor=-1&screen_name=twitterdev&skip_status=true&include_user_entities=false
  try {

    const twitter_token = "<Your method to get the user's twitter token>";
    const twitter_tokenSecret = "<Your method to get the user's twitter token-secret>";
    if (twitter_tokenSecret !== null && twitter_token !== null){
      let base_url = 'https://api.twitter.com/1.1/users/followers/list.json';

      let url = base_url+'?cursor=-1&screen_name='+
                screen_name+'&skip_status=true&include_user_entities=false';
      let parameter_dict={
        screen_name: screen_name,
        skip_status: true,
        include_user_entities: false
      }
      let header = _buildRequestHeader(twitter_token, twitter_tokenSecret, base_url, parameter_dict);
       fetch(url, {
         method: 'GET',
         headers: {
           'Accept': '*/*',
           'Content-Type': 'application/x-www-form-urlencoded',
           'Authorization': header
         }
       }).then((response) =>{ return response.json()})
          .then((json) => {
            console.log(json);
            success_callback(json);
            return json;
          });

      }else{
        console.log('no data');
        failure_callback();
        return false;
      }
  } catch (error) {
    // Error retrieving data
    console.log('there was an error retrieving timeline');
    console.log(error);
    failure_callback();
    return true;
  }
}
export async function fetchProfile(screen_name, success_callback, failure_callback){
// GET https://api.twitter.com/1.1/users/show.json?screen_name=twitterdev
  try {

  const twitter_token = "<Your method to get the user's twitter token>";
  const twitter_tokenSecret = "<Your method to get the user's twitter token-secret>";
  if (twitter_tokenSecret !== null && twitter_token !== null){
    let base_url = 'https://api.twitter.com/1.1/users/show.json';
    let url = base_url+'?screen_name='+screen_name;

    let parameter_dict = {screen_name: screen_name}
    let header = _buildRequestHeader(twitter_token, twitter_tokenSecret, base_url, parameter_dict);
     fetch(url, {
       method: 'GET',
       headers: {
         'Accept': '*/*',
         'Content-Type': 'application/x-www-form-urlencoded',
         'Authorization': header
       }
     }).then((response) =>{ return response.json()})
        .then((json) => {
          console.log(json);
          success_callback(json);
          return json;
        });

    }else{
      failure_callback();
      console.log('no data')
      return false;
    }
  } catch (error) {
    // Error retrieving data
    console.log('there was an error retrieving timeline');
    console.log(error);
    failure_callback();
    return true;
  }
}

export async function fetchTweetByID(tweet_id, success_callback, failure_callback){
  // GET https://api.twitter.com/1.1/statuses/show.json?id=210462857140252672
  // This request could also be obtained with: GET https://api.twitter.com/1.1/statuses/show/210462857140252672.json
  try {

    const twitter_token = "<Your method to get the user's twitter token>";
    const twitter_tokenSecret = "<Your method to get the user's twitter token-secret>";
    if (twitter_tokenSecret !== null && twitter_token !== null){
      let url = 'https://api.twitter.com/1.1/statuses/show/'+tweet_id+'.json';

      let header = _buildRequestHeader(twitter_token, twitter_tokenSecret, url);
       fetch(url, {
         method: 'GET',
         headers: {
           'Accept': '*/*',
           'Content-Type': 'application/x-www-form-urlencoded',
           'Authorization': header
         }
       }).then((response) =>{ return response.json()})
          .then((json) => {
            console.log(json);
            success_callback(json);
            return json;
          });

      }else{
        console.log('no data');
        failure_callback();
        return false;
      }
    } catch (error) {
      // Error retrieving data
      console.log('there was an error retrieving timeline');
      console.log(error);
      failure_callback();
      return true;
    }

}
export function fetchTwitterThreadAncestory(tweet_id){
  // i think this is just a nested in replyto thing
  //recursive
  let tweets = [];
  return fetchTweetAncestor(tweet_id, tweets);

}
export function fetchTweetAncestor(tweet_id, tweets){
    tweets.unshift()
    fetchTweetByID(tweet_id).then(res=>{
      tweets.unshift(res);
      if(res.in_reply_to_status_id != null){
        fetchTweetAncestor(res.in_reply_to_status_id, tweet)
      }else{
        return tweets;
      }
    }).catch(err=>{
      return null;
    });
}
export async function fetchTweetReplies(tweet_id, handle, success_callback, failure_callback){
    /* GET https://api.twitter.com/1.1/search/tweets.json?q=%23freebandnames&since_id=24012619984051000&max_id=250126199840518145&result_type=mixed&count=4
    There is a workaround using the REST API.

    You will need the id_str and @username of the author of the original tweet
    you want to find replies to.
    You should use the Search API for the "@username" of the author.
    Go through the results looking for the 'in_reply_to_status_id'
    field to compare to the id_str of the specific tweet you want replies for.
    */
    let tweets = [];
    try {
      const twitter_token = "<Your method to get the user's twitter token>";
      const twitter_tokenSecret = "<Your method to get the user's twitter token-secret>";
      if (twitter_tokenSecret !== null && twitter_token !== null){
        // You will need the id_str and @username of the author of the original tweet
        // you want to find replies to.
        // You should use the Search API for the "@username" of the author.

// when you fetch the tweet store the tweetId ie., id_str
// using twitter search api do the following query [q="to:$tweeterusername", sinceId = $tweetId]
// Loop all the results , the results matching the in_reply_to_status_id_str to $tweetid is the replies for the post.

        let query = '@'+handle;
        let base_url = 'https://api.twitter.com/1.1/search/tweets.json';
        let url = base_url + '?q='+encodeURIComponent(query)+'&since_id='+tweet_id;

        let parameter_dict = {q:query, since_id: tweet_id};
        let header = _buildRequestHeader(twitter_token, twitter_tokenSecret, base_url, parameter_dict);
        console.log(url);
         fetch(url, {
           method: 'GET',
           headers: {
             'Accept': '*/*',
             'Content-Type': 'application/x-www-form-urlencoded',
             'Authorization': header
           }
         }).then((response) =>{

           console.log(response);
           return response.json()}
         ).then((json) => {
              console.log(json);
              let statuses = json.statuses;
              //  Go through the results looking for the 'in_reply_to_status_id'
              //  field to compare to the id_str of the specific tweet you want replies for.
              statuses.forEach((tweet)=>{
                console.log(tweet);
                if(tweet.in_reply_to_status_id == tweet_id){
                  tweets.push(tweet);
                }
              })
              if(callback){
                success_callback(tweets);
              }
            });

        }else{
          console.log('no data');
          failure_callback();
          return false;
        }
      } catch (error) {
        // Error retrieving data
        console.log('there was an error retrieving timeline');
        console.log(error);
        failure_callback();
        return true;
      }
}
export async function fetchUserTweetReplies(tweet_id){
  // https://twittercommunity.com/t/see-replys-to-a-tweet/6953
  // https://stackoverflow.com/questions/2693553/replies-to-a-particular-tweet-twitter-api
  // https://stackoverflow.com/questions/29928638/getting-tweet-replies-to-a-particular-tweet-from-a-particular-user
// https://dev.twitter.com/rest/reference/get/statuses/mentions_timeline
// GET https://api.twitter.com/1.1/statuses/mentions_timeline.json?count=2&since_id=14927799
// https://www.quora.com/How-can-I-get-a-list-of-replies-to-a-specific-tweet-via-Twitter-API
/*
There is a workaround using the REST API.

You will need the id_str and @username of the author of the original tweet you want to find replies to.

You should use the Search API for the "@username" of the author. Go through the results looking for the 'in_reply_to_status_id' field to compare to the id_str of the specific tweet you want replies for.

4
down vote
Here's a work around to fetch replies of a tweet made by "username" using the rest API using tweepy

1) Find the tweet_id of the tweet for which the replies are required to be fetched

2) Using the api's search method query the following (q="@username", since_id=tweet_id) and retrieve all tweets since tweet_id

3) the results matching the in_reply_to_status_id to tweet_id is the replies for the post.


Hey I came across this and felt like there needed to be an updated answer for 1.1 API.

Do an Auth GET request to 'statuses/mentions_timeline'.
Loop results and parse for 'in_reply_to_status_id' field to compare to the id_str of the specific tweet you want replies for.
*/


}
