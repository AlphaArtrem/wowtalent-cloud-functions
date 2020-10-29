const functions = require('firebase-functions');
const admin = require('firebase-admin');
const urlBuilder = require('build-url');
const request = require('request-promise');

admin.initializeApp(functions.config().firebase);

exports.videoDynamicLink = functions.firestore
    .document('videos/{video}')
    .onCreate((snap, context) => {
        let videoData = snap.data();
        const videoId = snap.id;
        const videoRef = snap.ref;

        if (videoData.addedDynamicLink === true) {
            return;
        }

        const options = {
            method: 'POST',
            uri: `https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=${functions.config().applinks.key}`,
            body: {
                "longDynamicLink": makeDynamicLongLink(videoData, videoId)
            },
            json: true
        };

        console.log(options);

        return request(options)
            .then((parsedBody) => {
                console.log(parsedBody);
                return parsedBody.shortLink;
            })
            .then((shortLink) => {
                videoData.shareUrl = shortLink;
                console.log('short link: ' + shortLink);
                videoData.addedDynamicLink = true;
                videoData.dynamicLink = shortLink;
                return videoRef.update(videoData);
            }).catch(error => console.log(error))
    });

function makeDynamicLongLink(videoData, videoId) {
    const link = urlBuilder(`${functions.config().applinks.link}`, {
        queryParams: {
            link: "https://wowtalent.com/player?videoId=" + videoId,
            apn: "com.example.wowtalent",
            afl: "https://www.hellobatlabs.com/",
            st: videoData.videoName,
            sd: "WowTalent - " + videoData.videoName,
            si: videoData.thumbUrl
        }
    });
    console.log(link)
    return link;
}