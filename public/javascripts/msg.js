$(function(){
	$('.msg').on('click',function(){
		$(this).fadeOut(400,function(){
			$(this).remove();
		});
	});
});