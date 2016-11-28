// Semi random colors for tags
var colors = ['orange', 'teal', 'cyan', 'red', 'purple', 'blue', 'pink', 'brown'];
var tags_map = {};

var randomColorFromString = function (str, colors) {
    function digitize (str) {
        var code = 0;
        if (str === undefined) { return code; }
        for (var i = 0; i < str.length; i++)
            code += str.charCodeAt(i);
        return code;
    }

    var code = digitize(str);
    return colors[(code % colors.length)];
};

// Load data in DOM
var loadJSON = function (url, callback) {   
    var xobj = new XMLHttpRequest();
    
    xobj.overrideMimeType("application/json");
    xobj.open('GET', url, true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            callback(JSON.parse(xobj.responseText));
        }
    };
    xobj.send(null);  
};

var cardsToTemplates = function (cards) {
    var templates = [];
    for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        var template = {
            from: card.name.split(' :: ')[1] || '',
            subject: card.name.split(' :: ')[0],
            copy: card.desc,
            tags: card.labels,
            cardId: card.id,
            imageId: card.idAttachmentCover
        }

        templates.push(template);
    }
    return templates;
};

loadJSON('/dataSource.json', function (cards) {
    var templates = cardsToTemplates(cards);
    
    for (var i = 0; i < templates.length; i++) {
        var email = templates[i];

        var tags_html = '';
        for (var j = 0; j < email.tags.length; j++) {
            var tag = email.tags[j].name;
            tags_map[tag] = true;
            tags_html += '<span class="tag '+randomColorFromString(tag, colors)+'">'+tag+'</span>';
        }

        var html = ''+
          '<div class="email">'+
            '<div class="close">âœ–</div>'+
            '<div class="brand"><img class="brand-logo"> <span class="brand-name">'+email.from+'</span></div>'+
            '<div class="tags">'+tags_html+'</div>'+
            '<div class="email-headers"><strong>'+email.subject.replace('<', '&lt;').replace('>', '&gt;')+'</strong></div>'+
            '<div class="email-copy">'+
              '<p>'+email.copy.replace('<', '&lt;').replace('>', '&gt;').replace(/(?:\r\n|\r|\n)/g, '<br>')+'</p>'+
            '</div>'+
            '<div class="pad"></div>'+
          '</div>';

        var el = document.createElement('div');
        el.classList.add('col-4-12');
        el.innerHTML = html;
        document.getElementById('emails').appendChild(el);

        if (email.imageId) {
            el.getElementsByClassName("brand-name")[0].style.display = 'none';
            loadJSON('https://api.trello.com/1/cards/'+email.cardId+'/attachments/'+email.imageId, (function (element) {
                return function (img) {
                    element.getElementsByClassName("brand-logo")[0].src = img.url;
                }
            })(el));
        }
    }

    for (var i in tags_map) {
        var el = document.createElement('span');
        el.classList.add('tag');
        el.classList.add(randomColorFromString(i, colors));
        el.textContent = i;
        document.getElementById('tags').appendChild(el);
    }

    // Event handlers
    var emails = document.getElementsByClassName('email');

    for (var i = 0; i < emails.length; i++) (function (email) {
        email.addEventListener('click', function (e) {
            if (e.target.classList.contains('close')) {
                email.parentElement.classList.remove('active');
                document.getElementsByTagName('body')[0].classList.remove('noscroll');
            } else {
                email.parentElement.classList.add('active');
                document.getElementsByTagName('body')[0].classList.add('noscroll');
            }
        });

        email.parentElement.addEventListener('click', function (e) {
            if (e.target == email.parentElement) {
                email.scrollTop = 0;
                email.parentElement.classList.remove('active');
                document.getElementsByTagName('body')[0].classList.remove('noscroll');
            }
        });
    })(emails[i]);

    // Filter & Search
    var filterAndSearch = function () {
        var query = document.getElementById('searchbox').value;
        var match = new Function;


        if (!query.length) {
            match = function () { return true; };
        } else if (query[0] == '#') {
            match = function (email) { 
                var tags = email.getElementsByClassName('tag');
                for (var j = 0; j < tags.length; j++) {
                    if ('#' + tags[j].textContent.replace(' ', '-') == query)
                        return true;
                }
                return false;
            };
        } else {
            match = function (email) {
                // TODO: fuzzy search one day?
                return (email.textContent.toLowerCase().indexOf(query.toLowerCase()) >= 0);
            }
        }

        for (var i = 0; i < emails.length; i++) {
            if (match(emails[i]))
                emails[i].parentElement.style.display = '';
            else
                emails[i].parentElement.style.display = 'none';
        }
    }

    var tags = document.getElementsByClassName('tag');
    for (var i = 0; i < tags.length; i++) (function (tag) {
        tag.addEventListener('click', function (e) {
            document.getElementById('searchbox').value = '#' + tag.textContent.replace(' ', '-');
            filterAndSearch();
        })
    })(tags[i]);

    document.getElementById('searchbox').addEventListener('input', filterAndSearch);
});

console.log('Brought to you by Front, https://frontapp.com');
